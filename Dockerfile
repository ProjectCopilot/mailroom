FROM node:6.3.0

ADD . /usr/src/app
WORKDIR /usr/src/app

RUN npm install . && \
npm install copilot-communication && \
npm install copilot-prioritize

CMD ["node", "app.js"]
