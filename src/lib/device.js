// Anonymous per-browser identity. There's no login — we just need a stable id
// to scope each browser's meal history. Generated once and kept in localStorage,
// so it survives refreshes and reopening the app on the same device.

const KEY = "mythaali_device_id";

export function getDeviceId() {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
