#Base Image
FROM node:24.15-alpine

#Workdir
WORKDIR /frontend 

#COPY
COPY package*.json ./

#Command
RUN npm install

#COPY
COPY . .

#Port
EXPOSE 5173

#Command
CMD [ "npm","run","dev","--","--host","0.0.0.0"]