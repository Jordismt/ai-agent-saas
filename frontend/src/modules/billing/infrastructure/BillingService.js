import { apiFetch } from "../../../infrastructure/http/apiClient.js";
export class BillingService {
  getStatus(id) { return apiFetch(`/billing/status?businessId=${encodeURIComponent(id)}`); }
  createCheckout(id) { return apiFetch("/billing/checkout", {method:"POST",body:JSON.stringify({businessId:id})}); }
  setRenewal(id,cancel) { return apiFetch("/billing/renewal",{method:"POST",body:JSON.stringify({businessId:id,cancel})}); }
  createPortal(id) { return apiFetch("/billing/portal", {method:"POST",body:JSON.stringify({businessId:id})}); }
}
