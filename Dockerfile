
# Utiliza la imagen oficial de Node.js versión 20.5.1 como base
FROM node:20.5-alpine3.17 as bot
# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos package.json y package-lock.json (si existe)
COPY package*.json ./

# Instala las dependencias del proyecto
RUN npm install

# Copia el resto de los archivos del proyecto
COPY . .
# Construye la aplicación (si es necesario)
# RUN npm run build

# Expone el puerto en el que se ejecutará la aplicación
EXPOSE 3000

# Define la variable de entorno para la clave API de OpenAI
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
# Define la variable de entorno para el ID del asistente
ENV ASSISTANT_ID=${ASSISTANT_ID}

# Comando para iniciar la aplicación
CMD ["npm", "start"]
