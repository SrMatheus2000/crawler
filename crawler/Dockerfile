FROM node:16

LABEL maintainer="Agem Consulting"

WORKDIR /usr/app

RUN apt-get update
RUN apt-get upgrade -y


RUN DEBIAN_FRONTEND=noninteractive apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget x11vnc x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps xvfb

RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb 
RUN apt-get install ./google-chrome-stable_current_amd64.deb -y

COPY . .

RUN yarn install

EXPOSE 8093

CMD xvfb-run --server-args="-screen 0 1024x768x24" yarn prod