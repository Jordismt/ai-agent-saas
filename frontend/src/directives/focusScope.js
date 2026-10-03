// Keyboard/focus behaviour shared by the existing drawer and dialogs.
const scopes = new Set();
let originalOverflow = "";
const focusable = (element) => [...element.querySelectorAll(
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
)].filter(node => node.getClientRects().length && !node.closest('[inert]'));
function activate(element, binding) {
  if (!binding.value?.active || element._focusScope) return;
  const previous = document.activeElement;
  if (!scopes.size) { originalOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
  scopes.add(element);
  const handler = (event) => {
    if ([...scopes].at(-1) !== element) return;
    if (event.key === "Escape") { event.preventDefault(); element._focusScope.options.onClose?.(); }
    if (event.key !== "Tab") return;
    const nodes = focusable(element);
    if (!nodes.length) { event.preventDefault(); element.focus(); return; }
    const first = nodes[0], last = nodes.at(-1);
    if (event.shiftKey && (document.activeElement === first || !element.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !element.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
  };
  element._focusScope = { previous, handler, options:binding.value };
  element.tabIndex = -1;
  document.addEventListener("keydown", handler);
  requestAnimationFrame(() => { if (element._focusScope) (focusable(element)[0] || element).focus(); });
}
function deactivate(element) {
  const state = element._focusScope;
  if (!state) return;
  document.removeEventListener("keydown", state.handler);
  scopes.delete(element);
  if (!scopes.size) document.body.style.overflow = originalOverflow;
  delete element._focusScope;
  if (state.previous?.isConnected) state.previous.focus();
}
export const vFocusScope = {
  mounted:activate,
  updated(element, binding) {
    if (!binding.value?.active) deactivate(element);
    else { activate(element, binding); element._focusScope.options = binding.value; }
  },
  beforeUnmount:deactivate,
};
