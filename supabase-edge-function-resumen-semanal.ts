// ============================================================
// STOCKIA - Edge Function: Resumen Semanal por Email
// Archivo: supabase/functions/resumen-semanal/index.ts
//
// Deployment:
//   supabase functions deploy resumen-semanal
//
// Schedule (cron) en supabase/config.toml:
//   [functions.resumen-semanal]
//   verify_jwt = false
//   schedule = "0 8 * * 1"  # Todos los lunes a las 8am UTC
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') // Opcional: usar Resend para emails

serve(async (req: Request) => {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Obtener todas las empresas activas
    const { data: empresas } = await sb
      .from('empresas')
      .select('id, nombre, email_contacto')
      .eq('activa', true)

    if (!empresas?.length) {
      return new Response(JSON.stringify({ message: 'No hay empresas activas' }), { status: 200 })
    }

    const resultados: any[] = []

    for (const empresa of empresas) {
      // Stock total y productos con bajo stock
      const { data: productos } = await sb
        .from('productos')
        .select('nombre, stock')
        .eq('empresa_id', empresa.id)
        .eq('activo', true)

      const stockTotal = (productos || []).reduce((s: number, p: any) => s + (p.stock || 0), 0)
      const bajoStock = (productos || []).filter((p: any) => p.stock < 5)

      // Ventas activas
      const { count: ventasActivas } = await sb
        .from('ventas')
        .select('id', { count: 'exact' })
        .eq('empresa_id', empresa.id)
        .eq('estado', 'activa')

      // Deuda total
      const { data: items } = await sb
        .from('venta_items')
        .select('deuda_restante')
        .eq('empresa_id', empresa.id)

      const deudaTotal = (items || []).reduce((s: number, i: any) => s + parseFloat(i.deuda_restante || 0), 0)

      // Pagos vencidos esta semana
      const hoy = new Date().toISOString().split('T')[0]
      const haceUnaSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { count: pagosVencidos } = await sb
        .from('pagos')
        .select('id', { count: 'exact' })
        .eq('empresa_id', empresa.id)
        .eq('estado', 'pendiente')
        .lt('fecha_vencimiento', hoy)

      const { count: pagosEstaSemana } = await sb
        .from('pagos')
        .select('id', { count: 'exact' })
        .eq('empresa_id', empresa.id)
        .eq('estado', 'pagado')
        .gte('fecha_pago', haceUnaSemana)

      // Armar el email HTML
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #F3F4F6; padding: 20px; }
    .card { background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px; }
    h1 { color: #1F3A8A; }
    h2 { color: #1F3A8A; font-size: 1rem; }
    .stat { display: inline-block; padding: 8px 16px; background: #DBEAFE; border-radius: 6px; color: #1E40AF; font-weight: bold; margin: 4px; }
    .alert { background: #FEE2E2; color: #991B1B; padding: 8px 14px; border-radius: 6px; }
    .footer { color: #6B7280; font-size: 0.8rem; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📦 Resumen semanal — Stockia</h1>
    <p><strong>Empresa:</strong> ${empresa.nombre}</p>
    <p><strong>Semana:</strong> ${haceUnaSemana} al ${hoy}</p>
  </div>

  <div class="card">
    <h2>📊 Resumen general</h2>
    <span class="stat">📦 Stock total: ${stockTotal}</span>
    <span class="stat">🛒 Ventas activas: ${ventasActivas || 0}</span>
    <span class="stat">💰 Deuda total: $${deudaTotal.toLocaleString('es-AR')}</span>
    <span class="stat">✅ Pagos cobrados (semana): ${pagosEstaSemana || 0}</span>
    <span class="stat">❗ Cuotas vencidas: ${pagosVencidos || 0}</span>
  </div>

  ${bajoStock.length > 0 ? `
  <div class="card">
    <h2>⚠️ Productos con bajo stock</h2>
    ${bajoStock.map((p: any) => `<div class="${p.stock === 0 ? 'alert' : ''}" style="margin:4px 0">${p.nombre}: <strong>${p.stock} unidades</strong></div>`).join('')}
  </div>
  ` : ''}

  <p class="footer">Este es un resumen automático generado por Stockia. No respondas este email.</p>
</body>
</html>`

      // Enviar email (requiere RESEND_API_KEY configurado en Supabase secrets)
      if (RESEND_API_KEY && empresa.email_contacto) {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Stockia <resumen@stockia.app>',
            to: [empresa.email_contacto],
            subject: `📦 Resumen semanal Stockia — ${empresa.nombre}`,
            html: emailHtml
          })
        })
        resultados.push({ empresa: empresa.nombre, email: empresa.email_contacto, enviado: emailRes.ok })
      } else {
        // Sin email configurado: loguear los datos
        console.log(`Resumen para ${empresa.nombre}:`, { stockTotal, ventasActivas, deudaTotal, pagosVencidos })
        resultados.push({ empresa: empresa.nombre, sin_email: true })
      }
    }

    return new Response(JSON.stringify({ ok: true, resultados }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error: any) {
    console.error('Error en resumen-semanal:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
