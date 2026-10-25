FROM debian:trixie-slim

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg dbus-x11 xfce4 xfce4-terminal \
    tigervnc-standalone-server novnc websockify x11-utils \
    chromium fonts-dejavu procps \
    && curl -fsSL https://download.spotify.com/debian/pubkey_5384CE82BA52C83A.asc \
       | gpg --dearmor -o /usr/share/keyrings/spotify.gpg \
    && echo 'deb [signed-by=/usr/share/keyrings/spotify.gpg] https://repository.spotify.com stable non-free' \
       > /etc/apt/sources.list.d/spotify.list \
    && apt-get update && apt-get install -y --no-install-recommends spotify-client \
    && rm -rf /var/lib/apt/lists/*

ARG SPICETIFY_VERSION=2.46.3
ARG SPICETIFY_SHA256=e06836529fb3c2e5c4694f8467ccb10d03ae536d5a03ba3d973d17e3c5d58cdb
RUN mkdir -p /opt/spicetify \
    && curl -fsSL "https://github.com/spicetify/cli/releases/download/v${SPICETIFY_VERSION}/spicetify-${SPICETIFY_VERSION}-linux-amd64.tar.gz" \
       -o /tmp/spicetify.tar.gz \
    && echo "${SPICETIFY_SHA256}  /tmp/spicetify.tar.gz" | sha256sum -c - \
    && tar -xzf /tmp/spicetify.tar.gz -C /opt/spicetify \
    && ln -s /opt/spicetify/spicetify /usr/local/bin/spicetify \
    && rm /tmp/spicetify.tar.gz \
    && useradd --create-home --uid 1000 --shell /bin/bash theme \
    && chown -R theme:theme /usr/share/spotify

COPY --chmod=755 entrypoint.sh /usr/local/bin/pinkly-desktop
COPY --chmod=755 session.sh /usr/local/bin/pinkly-session
COPY --chmod=755 browser.sh /usr/local/bin/pinkly-browser
COPY --chmod=755 spotify.sh /usr/local/bin/spotify
COPY chromium.desktop /usr/local/share/applications/pinkly-browser.desktop

USER theme
ENV HOME=/home/theme DISPLAY=:1 XDG_RUNTIME_DIR=/tmp/pinkly-runtime \
    BROWSER=/usr/local/bin/pinkly-browser
WORKDIR /workspace/pinkly
EXPOSE 6080
ENTRYPOINT ["/usr/local/bin/pinkly-desktop"]
