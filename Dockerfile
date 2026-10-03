# Build de la app (Vite) + servidor nginx con cabeceras de seguridad.
# Easypanel: define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY como "Build args".
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY vendor ./vendor
RUN npm ci --legacy-peer-deps --no-audit --no-fund
COPY . .
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build

FROM nginx:1.27-alpine
# La URL de Supabase también entra a la CSP (connect-src); se reutiliza el mismo build arg.
ARG VITE_SUPABASE_URL
ENV SUPABASE_URL=$VITE_SUPABASE_URL
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
