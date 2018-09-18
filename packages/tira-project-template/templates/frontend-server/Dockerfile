FROM node:8.11.4-alpine
MAINTAINER xbdtb <xbdtb@163.com>
RUN echo "https://mirrors.aliyun.com/alpine/v3.6/main/" > /etc/apk/repositories
RUN apk add --no-cache --update git
RUN npm install -g npm@6.4.0

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ENV NODE_ENV production
ENV SERVER_PORT 80
EXPOSE 80
ARG PUBLIC_PATH
ENV PUBLIC_PATH ${PUBLIC_PATH}
ADD package.json /usr/src/app/
ADD package-lock.json /usr/src/app/
ADD .npmrc /usr/src/app/
RUN npm install
ADD ["postcss.config.js", "webpack.config.js", "/usr/src/app/"]
ADD client/ /usr/src/app/client/
ADD config/ /usr/src/app/config/
RUN npm run build-client-release
ADD . /usr/src/app/
RUN npm run compile
CMD ["npm", "run", "start-server:release"]
