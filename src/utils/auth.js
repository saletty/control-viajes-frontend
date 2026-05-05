export function logout(navigate) {
  // 🧹 Limpiar todo
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Opcional (si luego usas más cosas)
  localStorage.clear();

  // 🚀 Redirigir
  navigate("/", { replace: true });
}