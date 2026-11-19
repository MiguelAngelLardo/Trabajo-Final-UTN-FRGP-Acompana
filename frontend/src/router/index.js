import { createRouter, createWebHistory } from 'vue-router'
import { useSesionStore } from '../stores/sesion'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/auth/LoginView.vue'),
    meta: { publica: true, soloInvitados: true }
  },
  {
    path: '/registro',
    name: 'registro',
    component: () => import('../views/auth/RegistroView.vue'),
    meta: { publica: true, soloInvitados: true }
  },

  {
    path: '/',
    component: () => import('../layouts/AppLayout.vue'),
    children: [
      { path: '', name: 'inicio', redirect: () => rutaDeInicio() },

      {
        path: 'alumno',
        name: 'inicio-alumno',
        component: () => import('../views/alumno/InicioAlumnoView.vue'),
        meta: { rol: 'Alumno' }
      },
      {
        path: 'tutores',
        name: 'tutores',
        component: () => import('../views/tutorias/TutoresView.vue'),
        meta: { rol: 'Alumno' }
      },
      {
        path: 'apuntes',
        name: 'apuntes',
        component: () => import('../views/apuntes/ApuntesView.vue'),
        meta: { rol: 'Alumno' }
      },
      {
        path: 'solicitudes',
        name: 'solicitudes',
        component: () => import('../views/tutorias/SolicitudesView.vue'),
        meta: { rol: 'Alumno' }
      },
      {
        path: 'perfil',
        name: 'perfil',
        component: () => import('../views/alumno/PerfilView.vue'),
        meta: { rol: 'Alumno' }
      },

      {
        path: 'admin',
        name: 'inicio-admin',
        component: () => import('../views/admin/InicioAdminView.vue'),
        meta: { rol: 'Admin' }
      },
      {
        path: 'admin/usuarios',
        name: 'admin-usuarios',
        component: () => import('../views/admin/UsuariosView.vue'),
        meta: { rol: 'Admin' }
      },
      {
        path: 'admin/moderacion',
        name: 'admin-moderacion',
        component: () => import('../views/admin/ModeracionView.vue'),
        meta: { rol: 'Admin' }
      },
      {
        path: 'admin/catalogo',
        name: 'admin-catalogo',
        component: () => import('../views/admin/CatalogoView.vue'),
        meta: { rol: 'Admin' }
      }
    ]
  },

  { path: '/:pathMatch(.*)*', redirect: () => rutaDeInicio() }
]

function rutaDeInicio() {
  const sesion = useSesionStore()
  if (!sesion.estaLogueado) return { name: 'login' }
  return sesion.esAdmin ? { name: 'inicio-admin' } : { name: 'inicio-alumno' }
}

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const sesion = useSesionStore()

  if (!to.meta.publica && !sesion.estaLogueado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.soloInvitados && sesion.estaLogueado) {
    return rutaDeInicio()
  }

  if (to.meta.rol && to.meta.rol !== sesion.rol) {
    return rutaDeInicio()
  }
})

export default router
