# Auditoría y mejora UI/UX del panel de Resbix

## Alcance y límites

Trabajo exclusivamente de frontend. Se mantienen las rutas reales, guards, servicios HTTP, endpoints, payloads, validaciones, acciones, estados y dependencias actuales. No se han modificado backend, base de datos, RLS, Stripe, prompts ni schemas del agente. Se conserva el email opcional de la tarea anterior.

Las verificaciones de navegador utilizan una entrada de desarrollo independiente y respuestas simuladas. No acceden a clientes reales, no ejecutan cobros ni eliminan cuentas. Los tests comprueban que los controles siguen invocando los handlers y contratos existentes; no sustituyen una prueba de integración con un entorno autenticado real.

## 1. Páginas y rutas revisadas

Todas utilizan `DashboardLayout.vue` y `style.css`, con estilos locales en cada vista. Se revisaron scripts, templates, CSS, estados, controles, acciones y consumidores del layout.

| Ruta | Pantalla y elementos revisados |
|---|---|
| `/dashboard` | Resumen, métricas, actividad reciente, atención pendiente, negocios y skeletons. |
| `/businesses` | Negocios, búsqueda, cards, estado vacío y creación. |
| `/businesses/create` | Formulario, información auxiliar, errores y navegación tras crear. |
| `/businesses/:id` | Negocio, accesos, contacto, horarios, turnos y creación/edición/eliminación de servicios. |
| `/businesses/:id/agent-config` | Instrucciones, bienvenida, radios de tono, vista orientativa, guardado y feedback. |
| `/businesses/:id/bookings` | Reservas, métricas, búsqueda, todos los filtros, estados, contacto, conversaciones y formulario manual. |
| `/businesses/:id/leads` | Métricas, búsqueda, filtros, datos de contacto, notas, fechas y cambio de estado. |
| `/businesses/:id/conversations` | Filtros, estados, canal, fecha de actividad y atención humana. |
| `/businesses/:id/conversations/:conversationId` | Mensajes, composición, detalles y acciones de gestión. |
| `/businesses/:id/employees` | Equipo, métricas, activos/inactivos, cards y modal de alta. |
| `/businesses/:id/employees/:employeeId` | Perfil, servicios, horarios, reservas, ausencias y desactivación. |
| `/businesses/:id/public-page` | Configuración de publicación, URL, plantillas, paletas, controles de diseño, preview y formularios. |
| `/businesses/:id/billing` | Presentación de suscripción y confirmaciones existentes; lógica de Stripe intacta. |
| `/settings` | Cuenta, negocios y presentación de la confirmación de eliminación. |

Las páginas públicas de chat, reserva, gestión por token, landing, autenticación y legales quedan fuera del rediseño. Los estilos nuevos están limitados por `.app-layout`, por lo que no se aplican a esas páginas.

## 2. Diagnóstico previo y plan

- Cada página incluía estilos locales extensos y varias correcciones tipográficas acumuladas; había tamaños, sombras y espaciados distintos para controles equivalentes.
- Las tablas de leads y reservas dependían del desplazamiento horizontal en móvil.
- Reservas carecía de calendario y de un detalle consultable independiente del formulario de edición.
- El drawer existente no aislaba el fondo, no atrapaba el foco ni se cerraba con Escape; su breakpoint de 760px dejaba poco espacio para tablet vertical.
- Los modales y botones de cierre requerían reglas comunes de tamaño, altura disponible y foco.
- Algunos formularios de empleados y el compositor de mensajes no tenían nombre accesible.
- La auditoría visual confirmó overflow en el checkbox de publicación, los accesos del negocio en tablet y métricas del resumen a 320px.
- Los datos del resumen proporcionan contadores y actividad, pero no las citas detalladas de hoy. No se han deducido fechas de citas a partir de la fecha de creación de una actividad.

Plan aplicado: capa visual común acotada al panel; navegación accesible; calendario sobre los datos existentes; adaptación de tablas; correcciones puntuales de labels y overflow; pruebas de navegador y regresión.

## 3. Archivos modificados y creados

| Archivo | Cambio |
|---|---|
| `frontend/src/layouts/DashboardLayout.vue` | Drawer hasta 1023px, contexto de sección, accesos a negocio/servicios, agente y suscripción, enlace de salto, foco, Escape, aislamiento del fondo y navegación que no desborda. |
| `frontend/src/modules/bookings/presentation/BookingListView.vue` | Calendario principal y lista conservada, filtros móviles desplegables, detalle de reserva, conexión a las acciones actuales, feedback y modal accesible. |
| `frontend/src/modules/businesses/presentation/BusinessDetailView.vue` | Nombre accesible de los switches de cierre por día; handlers intactos. |
| `frontend/src/modules/businesses/presentation/BusinessAgentConfigView.vue` | Radios de tono agrupados para teclado y semántica del feedback; configuración y guardado intactos. |
| `frontend/src/modules/dashboard/presentation/DashboardView.vue` | Mensaje más accionable y acceso directo a la agenda de cada negocio con los contadores recibidos. |
| `frontend/src/modules/leads/presentation/LeadListView.vue` | Labels accesibles, nombres de celdas para presentación móvil y tabla navegable con teclado. |
| `frontend/src/modules/conversations/presentation/ConversationDetailView.vue` | Nombre accesible del campo de respuesta. |
| `frontend/src/modules/employees/presentation/EmployeeListView.vue` | Semántica y foco del modal existente; tipo de input de teléfono. |
| `frontend/src/modules/employees/presentation/EmployeeDetailView.vue` | Nombres accesibles de campos de perfil, turnos y ausencias; teclado de teléfono. |
| `frontend/src/modules/publicPages/presentation/PublicPageSettingsView.vue` | Corrección del checkbox invisible de publicación que desbordaba la página. |
| `frontend/src/dashboard-ui.css` — nuevo | Sistema de presentación común, reglas responsive, cards móviles, formularios, tablas, modales y estados; no altera tokens globales fuera del panel. |
| `frontend/src/directives/focusScope.js` — nuevo | Directiva reutilizable de foco, Escape, bloqueo del scroll y restauración del foco para drawer y modales. |
| `frontend/src/modules/bookings/presentation/components/BookingCalendar.vue` — nuevo | Vistas día, semana, mes y agenda móvil; no consulta disponibilidad ni modifica reservas. |
| `frontend/src/modules/bookings/presentation/calendar/calendarDates.js` — nuevo | Aritmética de fechas civiles para navegación y agrupación cronológica sin modificar los instantes de las reservas. |
| `frontend/tests/calendarDates.test.js` — nuevo | Casos de fechas, semanas, meses, años bisiestos, timezone, cambio horario y agenda vacía. |
| `frontend/tests/ui-preview.html` — nuevo | Entrada independiente para inspección local con fixtures. |
| `frontend/tests/ui-preview.js` — nuevo | Fixtures y montaje de las 14 vistas reales; no se importa desde la aplicación. |
| `frontend/tests/run-ui-audit.mjs` — nuevo | Auditoría mediante Chrome DevTools: capturas, tamaños, overflow, labels, modales y acciones con endpoints simulados. |
| `docs/resbix-ui-ux-audit.md` — nuevo | Este informe, inventario y límites de validación. |

## 4. Componentes reutilizados

Se reutilizan el layout, RouterLink/RouterView, todas las vistas existentes, sus cards, estados vacíos, skeletons, formularios, controles y confirmaciones. Reservas continúa usando `BookingService`, sus datos, los formateadores de fecha/hora del negocio, filtros, opciones de estado y handlers originales. La creación/edición sigue usando el formulario manual y los slots enviados por el backend.

El único componente visual nuevo es `BookingCalendar.vue`. El detalle de reserva se integra en la vista existente y utiliza la misma directiva de accesibilidad que sus formularios y el drawer.

## 5. Mejoras UI, UX y responsive

- Tipografía y jerarquía comunes, títulos de tamaño moderado, cards blancas sobre fondo suave, borders y sombras discretas.
- Inputs, botones, labels, estados disabled, radios/switches, acciones destructivas y foco más consistentes.
- Controles principales de al menos 44px; acciones compactas de tabla de al menos 40px.
- Formularios y layouts auxiliares se apilan cuando el espacio disponible lo requiere.
- Leads y lista de reservas pasan a cards en móvil; conservan todas las celdas, contactos, notas y acciones.
- En conversaciones se conservan también la fecha de actividad y el aviso de atención humana en la presentación móvil.
- Los modales limitan su altura al viewport dinámico, permiten scroll interno y mantienen un pie de acciones sticky.
- La agenda aparece antes que las métricas en móvil. Los filtros se despliegan con un botón que informa del número de filtros activos.
- Estados vacíos, carga y errores existentes conservados. Reservas añade feedback de creación, edición, cancelación y cambio de estado.
- Respeto de `prefers-reduced-motion` y tamaños de inputs móviles que evitan el zoom por texto pequeño.

## 6. Navegación móvil

Hasta 1023px, una barra superior fija al desplazamiento muestra marca, sección cuando cabe y botón de menú. El drawer conserva las secciones existentes y añade accesos a rutas ya disponibles. El fondo queda inert y el scroll bloqueado mientras está abierto. El foco permanece dentro; Escape, cierre, overlay o navegación lo cierran. El foco vuelve al control previo. El drawer tiene scroll vertical propio cuando hay muchas opciones o poca altura.

En desktop se conserva la sidebar, con activo más claro y acceso directo a las secciones de configuración del negocio.

## 7. Calendario en desktop

Calendario es la presentación inicial. Día muestra las reservas por orden cronológico; semana muestra los siete días en columnas; mes muestra una cuadrícula de 42 días completos. Cada cita permite abrir detalle. Mes muestra hasta tres citas por celda y un acceso explícito a la agenda completa de ese día cuando hay más.

Hay navegación anterior/siguiente, Hoy, selección de fecha y cambio de vista. Búsqueda, empleado y estado se aplican al calendario. El filtro relativo de fechas permanece en Lista, donde conserva su valor inicial de próximas reservas y todas sus opciones.

No hay drag and drop ni creación sobre celdas vacías. Una celda vacía significa únicamente ausencia de reservas que coincidan con los filtros, nunca disponibilidad.

## 8. Calendario en tablet

Desde 701px hasta 1200px, semana se presenta en dos columnas de días legibles, con el último día ocupando el ancho restante. Día y mes siguen disponibles. La navegación lateral utiliza drawer hasta 1023px para liberar espacio en tablet vertical. Se comprueban expresamente 768×1024 y 1024×768.

## 9. Agenda en móvil

Hasta 700px se muestra una agenda diaria independiente de la cuadrícula desktop, con hora de inicio/fin, cliente, servicio, empleado, duración y estado. Las citas están ordenadas cronológicamente. Anterior/siguiente cambian de día; Hoy y el selector de fecha permiten volver o saltar directamente. Lista sigue disponible. Detalles y acciones son los mismos que en desktop.

## 10. Representación y fechas de las reservas

Se muestran exclusivamente los estados existentes: pendiente, confirmada, completada, cancelada y no presentado. Todos tienen texto; los indicadores y fondos complementan ese texto. Se identifica el empleado de cada reserva, con `Sin asignar` cuando corresponde. El email ausente se presenta como `No facilitado` en el detalle.

La agrupación utiliza el `getDateParts` que ya aplicaba la zona horaria del negocio. Horas e inicio/fin se muestran con el `formatTime` existente. La aritmética UTC de fechas civiles solo navega por etiquetas `YYYY-MM-DD`; no convierte ni modifica `starts_at` o `ends_at`. Los tests incluyen el cambio de horario de Madrid y reservas próximas a medianoche.

## 11. Validación funcional

Se comprueban con datos simulados las acciones existentes de:

- Navegación, cambio de vistas, día, semana, mes, Hoy y selector de fecha vacío.
- Búsqueda, empleado, estado y lista de reservas.
- Apertura de detalle y conversación, cambio de estado, creación manual sin email, edición y cancelación con confirmación.
- Cambio de estado y búsqueda de leads.
- Envío de mensaje y cambio de estado de conversación.
- Guardado de configuración del agente y web pública con los payloads existentes.
- Perfil, servicios, horario y alta de empleado.
- Guardado de horarios del negocio y creación, edición y eliminación de servicios con confirmación.
- Creación de negocio y navegación existente hacia suscripción.
- Apertura de confirmaciones de suscripción y eliminación de cuenta, sin ejecutar las operaciones finales.
- Estados vacíos de reservas, leads, conversaciones, equipo, negocios y resumen; carga y error de reservas.
- Drawer y modales: entrada de foco, Escape, aislamiento y restauración.

Se usan días vacíos, una cita, varias citas, citas consecutivas, distintos empleados y servicios, los cinco estados reales y un escenario denso con 46 citas y textos largos. Las comprobaciones visuales se realizan sobre las vistas reales; los guards de producción no se sustituyen ni se editan.

## 12. Build, lint y tests

- `npm --prefix frontend run build`: correcto. No se añaden dependencias. Continúa el aviso previo de chunk mayor de 500 kB. El build no contiene el entorno de fixtures.
- El frontend no tiene un script de lint configurado. Se ejecuta ESLint sobre los nuevos módulos JS y herramientas de prueba, y análisis de los once SFC afectados mediante el compilador Vue y ESLint: sin hallazgos.
- `node --test frontend/tests/calendarDates.test.js`: correcto.
- Auditoría de Chrome: 14 pantallas × 9 anchos (320, 360, 375, 390, 430, 768, 1024, 1440 y 1920), más dos orientaciones de tablet, calendarios densos y modales en los nueve anchos. Sin overflow de página ni campos visibles sin etiqueta en la matriz principal; sin errores de ejecución.
- Resultado final: 126 comprobaciones de páginas, 28 capturas adicionales de tablet, 17 comprobaciones de calendario, nueve de modales y 51 comprobaciones de acciones correctas. Se revisaron además las capturas para corregir contraste del editor y distribución de controles del calendario en tablet.
- `npm --prefix backend test -- --run`: 321 correctos y tres fallos previos en `SupabaseBookingRepository.test.js` (expectativas de `management_token_hash` y SELECT con empleado).
- `npm --prefix backend run lint`: falla únicamente por la variable previa `marta` sin usar en `CreateBookingEmployees.test.js:17`.
- `git diff --check`: correcto.

Los resultados y capturas se guardan en `/tmp/resbix-ui-audit/`; `report.json` contiene los resultados detallados. No se ha realizado una prueba con credenciales de clientes, Supabase real o Stripe real.

## 13. Problemas previos no modificados y recomendaciones

No se modifican los tres tests del repositorio desactualizados, la variable `marta` sin usar ni el aviso de tamaño del bundle. Tampoco se cambia el indicador estático existente de sistema operativo de la sidebar: no es una verificación de salud del backend.

Recomendaciones fuera de alcance: configurar lint Vue formal y CI; corregir las expectativas previas de tests en una tarea específica; considerar carga de rutas bajo demanda para reducir el bundle; ofrecer un endpoint de resumen con citas de hoy y próximas citas si se desea esa información detallada en el resumen principal; sustituir el indicador estático por información real de salud del servicio. No se implementan porque implican ampliar tooling, backend o alcance funcional.

## 14. Reproducir la auditoría local

Con Chrome instalado, iniciar un perfil temporal de Chrome headless con el puerto de depuración 9223 y servir Vite en 5174. Usar variables explícitas de prueba para que no se conecte con servicios reales:

```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_PUBLISHABLE_KEY=local-ui-test VITE_API_URL=http://127.0.0.1:3000 npm --prefix frontend run dev -- --host 127.0.0.1 --port 5174
node frontend/tests/run-ui-audit.mjs
node --test frontend/tests/calendarDates.test.js
```

La entrada es `http://127.0.0.1:5174/tests/ui-preview.html`. No se debe utilizar para probar seguridad, permisos ni integraciones: es un montaje de UI separado, con datos simulados, no una ruta de la aplicación publicada.
