FROM snupa/node:latest
# Node.js user is: app
WORKDIR /dispencer
COPY . /dispencer
RUN npm install -qp && \
    chown -R node /dispencer
USER node

ENTRYPOINT [ "node", "/dispencer/launch.js" ]
