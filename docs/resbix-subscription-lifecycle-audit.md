# Auditoría del ciclo de suscripciones de Resbix — 5 octubre 2026

## Resultado y límites de la investigación

Se ha demostrado y corregido una contradicción de código: `/billing/status` devolvía el estado y `trial_end` de Supabase, pero sobrescribía `current_period_end` con una consulta actual a Stripe. No sincronizaba esa consulta. El dashboard aceptaba exclusivamente el estado local `active`/`trialing`; la web pública además rechazaba un `trial_end` pasado. Por tanto una misma suscripción podía mostrar `trialing`, un período posterior en noviembre, permitir el guard del dashboard y producir `La prueba gratuita ha finalizado` en la web pública.

Se reprodujo ese comportamiento usando el código original de Git en `/tmp/resbix-original-reproduction`, sin alterar la copia de trabajo ni los datos reales. Nueve pruebas dirigidas de transición/reconciliación fallaron allí; entre ellas la reproducción exacta de estado local trialing junto a período de noviembre leído de Stripe. Con la corrección pasan.

Esto NO demuestra que la suscripción real estuviera `active`, ni identifica por sí solo un webhook perdido. Existe además una discrepancia de configuración/datos que exige comprobar el entorno desplegado.

### Evidencia externa obtenida exclusivamente por lecturas

La configuración local contiene una clave Stripe de prueba. La lectura de Supabase encontró una fila trialing vencida:

| Campo | Valor observado |
| --- | --- |
| business_id | `3b13f4eb-afda-46c7-80b2-913e976ca587` |
| stripe_subscription_id | `sub_1UJvDBLetLBzL898JwXZYE8k` |
| status | `trialing` |
| trial_end | `2026-10-03T12:59:56+00:00` |
| current_period_end | `2026-10-03T12:59:56+00:00` |
| updated_at | `2026-09-26T13:00:57.997+00:00` |
| last_payment_failed_at | `null` |

La consulta GET de esa suscripción con la clave local respondió `404 resource_missing / No such subscription`. La respuesta pertenecía al modo test y a la cuenta `acct_1UJYKWLQFMAde6a6`. Request ID: `req_5o4XqcJ7n4o9xi`.

No se consultaron clientes ni métodos de pago, no se ejecutaron cobros ni cancelaciones, no se invocaron endpoints de Resbix que escriban billing y no se modificó ningún dato real. No se publicaron claves ni firmas.

La fecha real encontrada es **3 octubre**, no 4 octubre. En Madrid equivale a 3 octubre 14:59:56; esa diferencia no se explica por redondear a medianoche. No puedo identificar esa fila inequívocamente como el negocio del incidente sin confirmar su ID y el entorno. Una cuenta, sandbox o modo distintos, o una suscripción de prueba eliminada, pueden explicar el 404; no se ha demostrado cuál.

Con esta configuración local la verificación seguirá fallando de forma segura. El código no inventa un estado activo para compensar una clave que no puede consultar la suscripción.

## Inventario auditado y fuente de verdad anterior

| Capa / archivos | Regla o función anterior |
| --- | --- |
| `backend/src/app.js` | POST `/billing/webhook` con `express.raw` antes de `express.json`; middleware de errores al final. |
| `backend/src/modules/billing/presentation/billingRoutes.js` | Stripe SDK, Checkout por negocio, metadata business/owner, customer por propietario, trial de 7 días, tarjeta obligatoria, cancelar sin tarjeta. `/status`, `/renewal`, `/portal`, webhook y función `sync`. |
| `backend/src/shared/billing/requireActiveBusiness.js` | Requiere ID Stripe y estado local active/trialing; para trialing además exige `trial_end` y rechaza `Date.parse(trial_end) <= Date.now()`. |
| `frontend/src/router/index.js` | `paidBusinessGuard`: permite exclusivamente por `billing.status` active/trialing, sin mirar fecha ni requerir ID Stripe. |
| `frontend/src/router/authGuard.js`, `layouts/DashboardLayout.vue` | Sesión para acceder al dashboard de cuenta; el layout no constituye autorización de suscripción. |
| `frontend/src/modules/businesses/presentation/BusinessListView.vue` | Destino de enlaces decidido por estado active/trialing. |
| `frontend/src/modules/billing/{infrastructure/BillingService.js,presentation/BusinessBillingView.vue}` | Estado del endpoint; fecha prioriza current_period_end sobre trial_end; etiqueta ambigua “Próxima renovación o fin de prueba”; fecha sin hora. |
| `frontend/src/modules/publicPages/{infrastructure/PublicPageService.js,presentation/PublicBusinessView.vue}` | URL `/:slug`, GET público; propaga el mensaje de error del backend. No calcula la expiración en el navegador. |
| `backend/src/modules/publicPages/presentation/businessPublicPageRoutes.js` | `resolvePublishedPage` resuelve slug publicado y ejecuta requireActiveBusiness; también disponibilidad y reservas públicas. |
| `backend/src/modules/publicPages/{presentation/BusinessPublicPageController.js,application/GetPublishedBusinessPage.js,infrastructure/SupabaseBusinessPublicPageRepository.js}` | Selección por slug y published, carga del negocio y servicios/equipo/horarios; ownership para gestionar la página autenticada. |
| `backend/src/modules/public/presentation/publicRoutes.js` | Gate de suscripción en config pública, creación de conversación y envío de mensajes. Lectura de historial protegida por token de conversación, sin gate de suscripción adicional. |
| `backend/src/modules/bookings/application/CreateBooking.js` | requireActiveBusiness antes de crear reservas; ownership de negocio se verifica antes en el controlador para reservas autenticadas. |
| `backend/src/modules/conversations/application/SupabaseAgentActionExecutor.js` | requireActiveBusiness para ejecutar acciones del agente. |
| `backend/src/modules/dashboard/{presentation/dashboardRoutes.js,infrastructure/SupabaseDashboardRepository.js}` | Resumen autenticado de los negocios del propietario; no exige suscripción. |
| Rutas/controladores/repositorios de negocios, leads, conversaciones, empleados, servicios, horarios y configuración | Gestión autenticada, ownership y cliente Supabase del usuario; no equivalen a un gate general de suscripción en todos los endpoints. No se añadió uno de forma indiscriminada. |
| `backend/src/shared/middleware/authMiddleware.js`, `infrastructure/database/supabase.js` | getUser, Bearer, cuenta en eliminación, cliente de usuario con token frente a cliente servidor. |
| `backend/src/modules/account/presentation/accountRoutes.js` | Eliminación de cuenta: localiza clientes/suscripciones, comprueba customer y cancela. No decide el entitlement habitual. No se cambió. |
| Vistas legales y landing | Textos de prueba, renovación, cancelación y conservación de datos; sin otra regla ejecutable de acceso. |

Antes no había un repositorio dedicado de suscripciones: los accesos a `business_billing` estaban en las rutas de billing, el gate y la eliminación de cuenta. Tampoco había tests específicos de billing/webhooks. No hay migraciones SQL en esta copia para auditar las políticas RLS desplegadas. No se modificaron RLS ni estructura de tablas.

### Funciones y condiciones que explican cada síntoma

- **Estado mostrado:** `BusinessBillingView` imprime `billing.status`; `/status` utilizaba `...data`, dejando el status de Supabase aunque había consultado Stripe.
- **Noviembre:** `/status` usaba `subscription.items.data[0].current_period_end * 1000`, convertido a ISO; la vista elegía `current_period_end || trial_end`. Un período posterior no demuestra por sí mismo que el estado Stripe sea active ni que el cobro se haya completado.
- **Dashboard de cuenta:** `authGuard` comprueba sesión; `/dashboard/summary` comprueba autenticación y scope del propietario. Login/resumen/billing deben seguir disponibles para gestionar o recuperar el pago.
- **Dashboard del negocio:** `paidBusinessGuard` aceptaba `["active", "trialing"].includes(billing?.status)` sin comprobar la expiración utilizada por el gate público.
- **Bloqueo público:** `requireActiveBusiness` rechazaba `data.status === "trialing" && (!data.trial_end || Date.parse(data.trial_end) <= Date.now())`, con mensaje `La prueba gratuita ha finalizado`.
- **Recorrido público:** `/:slug` → `PublicBusinessView.loadPage` → `PublicPageService.getPublishedBySlug` → GET `/public/pages/:slug` → `resolvePublishedPage` → repositorio por slug publicado → gate → controlador/GetPublishedBusinessPage → repositorios de negocio/datos públicos → JSON. Un AppError 403 viaja por errorHandler y se muestra en la vista.

Hipótesis demostradas por código: **E** (decisión local de expiración), **F** (reglas distintas) y **G** (campos de distintas fuentes y etiqueta ambigua). La fila consultada conserva el estado inicial desde antes de vencer su trial. **A/B/C/D/I**, entendidas como diagnóstico del estado/sincronización real de Stripe, requieren confirmar la suscripción en el entorno correcto. **H** no tiene evidencia en esta lógica: se compara un instante completo, sin `.setHours`, fecha sin hora ni inicio del día.

## Política después del cambio

**Stripe determina el estado; Supabase conserva su copia sincronizada. Las fechas programan cuándo verificar, no fabrican estados.**

- `/billing/status` verifica ownership, consulta Stripe y persiste de forma segura **el mismo estado, trial_end y período** que devuelve; incluye `has_access` calculado en backend.
- Los webhooks utilizan el mismo reconciliador y consultan el objeto actual de Stripe. No aplican snapshots antiguos de eventos.
- El gate público/de reservas/de acciones consume el snapshot local si está permitido y dentro de su trial/período. En el límite exacto, con fechas ausentes/ilegibles o con estado no permitido vuelve a consultar Stripe y sincroniza antes de decidir.
- Un trial todavía `trialing` confirmado por Stripe conserva acceso incluso si el reloj local pasó su trial_end. No se cambia artificialmente a active. Si Stripe devuelve past_due u otro estado no permitido, se bloquea.
- Si falla Stripe, la base de datos o la validación de tenant, la comprobación no concede acceso a partir de un snapshot vencido. Errores de sincronización se propagan; un conflicto de escritura produce 503.
- Guards, enlace del listado y botón de entrada de billing utilizan `has_access === true`. No mantienen listas paralelas de estados.
- El dashboard de cuenta, login y la gestión de billing continúan siendo accesibles con autenticación. La gestión de datos conserva su autorización/ownership existente; no se ha convertido cada endpoint de administración en un producto nuevo de entitlement.

| Estado | Entitlement de funcionalidades suscritas | Gestión de cuenta/billing |
| --- | --- | --- |
| trialing | Sí, snapshot vigente o verificación actual de Stripe | Sí, autenticado y propietario |
| active | Sí, snapshot vigente o verificación actual de Stripe | Sí |
| past_due | No, se conserva la política sin período de gracia existente | Sí, para resolver pago |
| unpaid | No | Sí |
| canceled | No | Sí |
| incomplete | No | Sí |
| incomplete_expired | No | Sí |
| paused | No; no era un estado permitido y Checkout no configura pausa | Sí |
| checkout_pending | No | Sí |
| desconocido / sin estado / sin ID / sin registro | No | Sí |

Cancelar **al final** no cambia inmediatamente active/trialing a canceled. Se conserva acceso hasta que Stripe confirme su estado posterior. Pasar current_period_end tampoco cancela localmente: se verifica el siguiente período/estado.

Los snapshots locales válidos siguen dependiendo de los webhooks para cambios anticipados (por ejemplo cancelación inmediata). Esta corrección mantiene la arquitectura de sincronización eventual, añade recuperación en los límites y en billing y no promete atomicidad instantánea entre sistemas o verificación Stripe en cada request. No hay un cron nuevo ni un TTL nuevo ni una migración.

## Webhooks, idempotencia, concurrencia y aislamiento

Eventos conservados: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.

No se añadieron `invoice.paid` ni `invoice.payment_succeeded`: esta arquitectura determina acceso por el estado de Subscription, no por el estado de una factura aislada. Esos eventos no convierten nada a active. Para cambios del trial/renovación se necesita recibir los eventos Subscription utilizados. La documentación oficial explica esos cambios: [webhooks de suscripciones](https://docs.stripe.com/billing/subscriptions/webhooks).

Problemas detectados y corregidos además de la mezcla de billing:

1. La consulta de `/status` no reparaba la copia local. Ahora sincroniza los campos juntos.
2. `invoice.payment_failed` solo leía `invoice.subscription`, ausente en el esquema moderno. Ahora admite también `invoice.parent.subscription_details.subscription` y vuelve a consultar Subscription; no infiere el estado de acceso desde el fallo de factura.
3. El fallo de pago almacenaba la hora de recepción; un duplicado/antiguo cambiaba la fecha. Ahora usa `event.created` y conserva la última fecha de fallo mayor.
4. No había protección contra dos consultas Stripe concurrentes: una respuesta lenta podía sobrescribir una nueva. Ahora se lee la versión local **antes** de Stripe y se escribe condicionando business_id, el ID vinculado y updated_at. Una escritura competidora gana y la antigua falla para permitir reintento. Un insert inicial no sobrescribe otro registro: ignoreDuplicates.
5. El placeholder de Checkout podía sobrescribir una sincronización que hubiera ganado durante la creación/reintento de sesión. Su escritura está condicionada también a que no haya suscripción y a la versión leída.
6. La sincronización anterior no comprobaba owner/customer contra el negocio antes de vincular una suscripción inicial. Ahora se verifican ID, metadata business_id/owner_id y el customer del propietario, y se mantiene el rechazo de un ID distinto ya vinculado. Se conserva la exclusión de negocios eliminados/cuentas en eliminación.

Duplicados: resultado de negocio idempotente, aunque se actualice updated_at y se registre la recepción de nuevo. No existe ledger persistente de IDs de eventos ni deduplicación exactly-once; no se añadió uno ni se afirma que exista. Releer Stripe más escritura condicional evita reintroducir snapshots viejos en los casos probados. Un conflicto devuelve error y Stripe puede reintentar según su política. [Stripe no garantiza el orden de entrega](https://docs.stripe.com/webhooks).

Logs nuevos: `billing.webhook.received`, `billing.webhook.processed`, `billing.webhook.failed`, `billing.sync.completed`, `billing.sync.failed`, y `billing.sync.skipped` para ID distinto. Campos acotados: event ID/tipo, subscription ID, estado previo/nuevo, código de error o motivo. No se registran cuerpos, email, tarjeta, claves ni firmas.

## Fechas y billing

- Timestamps Unix Stripe en **segundos**, conversiones a ISO UTC con multiplicación por 1000 una sola vez.
- trial_end y current_period_end independientes; soporte de período en item para API moderna y root para anterior.
- La SDK instalada usa API `2026-08-26.dahlia`; el esquema local del SDK confirma el parent de Invoice.
- current_period_start no participa en autorización ni etiqueta; no era persistido y no se añadió columna.
- La comparación `<=` se mantiene únicamente como condición de **reconciliación en el instante exacto**, no como expiración unilateral.
- No se usan fecha truncada `YYYY-MM-DD`, inicio/final de día ni setHours en el ciclo de billing. Las fechas de calendario de reservas no se alteraron.
- La vista muestra **Fin de prueba → trial_end** cuando trialing y **Próxima renovación → current_period_end** cuando active, con hora en la zona del navegador. En cancelación programada se prioriza cancel_at y después el campo correspondiente al estado.

## Archivos modificados y añadidos

- `backend/src/shared/billing/subscriptionPolicy.js` (nuevo): política de acceso, criterio de refresco, conversión/proyección Stripe.
- `backend/src/shared/billing/subscriptionSync.js` (nuevo): reconciliación común, consultas Supabase, verificación de tenant/customer, escritura condicional y logs.
- `backend/src/shared/billing/requireActiveBusiness.js`: reemplaza expiración unilateral por verificación y política central.
- `backend/src/modules/billing/presentation/billingRoutes.js`: status coherente y has_access; webhook común, facturas modernas y logs; protege placeholder Checkout. Customer Portal y renovación mantienen su lógica.
- `frontend/src/router/index.js`: guard consume has_access.
- `frontend/src/modules/businesses/presentation/BusinessListView.vue`: destino consume has_access.
- `frontend/src/modules/billing/presentation/BusinessBillingView.vue`: consume has_access; etiqueta/campo/hora correctos.
- `backend/tests/SubscriptionPolicy.test.js` (nuevo): 32 casos de estados, campos, instantes y fronteras temporales.
- `backend/tests/SubscriptionLifecycle.test.js` (nuevo): 49 casos de Checkout, firma Stripe real, autenticación real con Supabase mock, rutas/repositorios reales con DB en memoria, eventos, transición, fallos y concurrencia.
- `backend/tests/BillingFrontend.test.js` (nuevo): 24 casos; ejecuta setup/template del SFC real con límites HTTP/router sustituidos, render SSR, fechas, estado y guard real del router.
- `backend/tests/helpers/BillingDatabase.js` (nuevo): frontera PostgREST en memoria para filtros y escritura condicional.
- `docs/resbix-subscription-lifecycle-audit.md` (nuevo): este informe.

No se modificaron tests existentes, RLS, SQL, duración/pricing/planes/cupones, calendarios, reservas, disponibilidad, leads, conversaciones, empleados, servicios, IA, prompts ni emails. No se ejecutó despliegue.

## Validación ejecutada

| Comprobación | Resultado |
| --- | --- |
| Suite completa antes del cambio | 321 pasan, 3 fallan; 42 archivos pasan y 1 falla |
| Suite completa final | **426 pasan, los mismos 3 fallan**; 45 archivos pasan y 1 falla |
| Nuevos tests de esta tarea | **105/105 pasan** |
| Nuevos tests bajo TZ=UTC | 105/105 |
| Nuevos tests bajo TZ=Europe/Madrid | 105/105 |
| Nuevos tests bajo TZ=America/Los_Angeles | 105/105 |
| Reproducción dirigida con código original | 9 fallos esperados de transición/reconciliación |
| frontend: npm run build | Correcto; aviso de chunk >500 kB |
| backend: npm run lint | Solo el fallo previo de marta sin usar |
| ESLint de todos los JS nuevos/modificados | Correcto |
| node --check de todos los módulos JavaScript del backend | Correcto |
| git diff --check | Correcto |

Fallos previos que no se corrigieron:

- `backend/tests/SupabaseBookingRepository.test.js`: create no espera el campo `management_token_hash: null` que ya inserta el repositorio; findById y findByBusinessId esperan select("*"), pero ya se incluye el join employee:employees(id,name). Tres aserciones fallidas antes y después.
- `backend/tests/CreateBookingEmployees.test.js:17`: variable `marta` sin utilizar, no-unused-vars.

Backend no tiene script build; usa JavaScript directo. Frontend no tiene script lint ni suite propia; sus pruebas de esta tarea se ejecutan desde Vitest del backend utilizando el compilador y runtime Vue instalados en frontend.

La transición probada incluye: Checkout con 7 días/tarjeta → placeholder sin entitlement → webhook Checkout → trialing persistido → página pública y estado/entitlement dashboard válidos → un milisegundo antes → instante exacto (consultar Stripe) → Subscription updated → active persistido → período de noviembre correcto → continuidad de acceso. También se prueban las ramas posteriores no válidas sin inventar active, recuperación sin webhook, fallo de pago, cancelación programada/real, duplicados, eventos antiguos, firma falsa y escritura concurrente. Las fechas incluyen medianoche local/UTC, mes, año y los dos instantes del cambio de hora de Madrid.

Límites: las fronteras Stripe/Supabase están simuladas en tests; se utiliza verificación de firma real del SDK. No se realizaron cobros reales, test clocks reales, pruebas E2E en navegador desplegado ni lecturas de políticas RLS reales. La suite regresiva existente valida las otras áreas, con los fallos anteriores indicados.

## Verificación manual pendiente — breve

1. **Stripe:** localizar la suscripción/negocio correcto en live/test/sandbox; comprobar status, trial_end y período del item. En Workbench revisar eventos y entregas Subscription del fin de trial, la URL `/billing/webhook`, los eventos habilitados y respuestas. Confirmar que clave y webhook secret del despliegue pertenecen a ese mismo entorno.
2. **Supabase:** comparar business_id, subscription ID, status, trial_end, current_period_end y updated_at. No editar status a mano. Si es otra fila, usar el business_id correcto.
3. **Resbix:** tras confirmar configuración y desplegar **backend antes del frontend**, abrir billing; comprobar que estado/fechas/has_access corresponden a Stripe y que la copia local se sincroniza. Probar entrada al negocio y mantener acceso a cuenta/billing si el pago falla.
4. **Web pública:** abrir el slug del mismo negocio: active o trialing verificado debe funcionar; estado no permitido debe bloquear. Si Stripe no encuentra la suscripción, corregir primero la configuración/identificación; no forzar acceso.
