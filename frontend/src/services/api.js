import axios from "axios";

const api = axios.create({ baseURL: "/api/v1" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login:            (data)      => api.post("/auth/login", data),
  me:               ()          => api.get("/auth/me"),
  cambiarPassword:  (data)      => api.post("/auth/cambiar-password", data),
  listarUsuarios:   ()          => api.get("/auth/usuarios"),
  crearUsuario:     (data)      => api.post("/auth/usuarios", data),
  actualizarUsuario:(id, data)  => api.put(`/auth/usuarios/${id}`, data),
  eliminarUsuario:  (id)        => api.delete(`/auth/usuarios/${id}`),
};
export const animalesAPI = {
  listar:     ()         => api.get("/animales/"),
  obtener:    (id)       => api.get(`/animales/${id}`),
  crear:      (data)     => api.post("/animales/", data),
  actualizar: (id, data) => api.put(`/animales/${id}`, data),
  eliminar:   (id)       => api.delete(`/animales/${id}`),
};
export const cortesAPI = {
  listar:     ()         => api.get("/cortes/"),
  porAnimal:  (aid)      => api.get(`/cortes/animal/${aid}`),
  crear:      (data)     => api.post("/cortes/", data),
  actualizar: (id, data) => api.put(`/cortes/${id}`, data),
  eliminar:   (id)       => api.delete(`/cortes/${id}`),
};
export const costosAPI = {
  listar:     ()         => api.get("/costos/"),
  porAnimal:  (aid)      => api.get(`/costos/animal/${aid}`),
  crear:      (data)     => api.post("/costos/", data),
  actualizar: (id, data) => api.put(`/costos/${id}`, data),
  eliminar:   (id)       => api.delete(`/costos/${id}`),
};
export const sipsaAPI = {
  consultar:  (p)  => api.get("/sipsa/consultar", { params: p }),
  guardar:    ()   => api.post("/sipsa/guardar"),
  promedios:  ()   => api.get("/sipsa/promedios"),
  historico:  ()   => api.get("/sipsa/historico"),
};
export const analisisAPI = {
  dashboard:       ()       => api.get("/analisis/dashboard"),
  calcularPrecios: (id, m)  => api.post(`/analisis/calcular-precios/${id}?margen=${m}`),
  costoKg:         (id)     => api.get(`/analisis/costo-kg/${id}`),
};
