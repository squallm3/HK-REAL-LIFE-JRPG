FROM nginx:alpine

COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY motor.js /usr/share/nginx/html/motor.js
COPY niveles.js /usr/share/nginx/html/niveles.js
COPY fragmentos.js /usr/share/nginx/html/fragmentos.js
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 80