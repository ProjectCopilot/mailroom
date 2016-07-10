FROM ubuntu

RUN apt-get install -y software-properties-common python
RUN add-apt-repository ppa:chris-lea/node.js
RUN echo "deb http://us.archive.ubuntu.com/ubuntu/ precise universe" >> /etc/apt/sources.list
RUN apt-get update
RUN apt-get install -y nodejs
#RUN apt-get install -y nodejs=0.6.12~dfsg1-1ubuntu1
RUN npm install -g n
RUN sudo n stable

ADD /copilot-core /copilot-core
RN cd /copilot-core && npm install

CMD ["/usr/bin/node", "app.js"] 