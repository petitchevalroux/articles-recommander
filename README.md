# articles-recommander
Articles recommander platform

## Datastore
Datastore is a [jsonapi client](https://github.com/holidayextras/jsonapi-client) instance.

### Launch redis server using docker
```
docker run -p 6379:6379 --name redis -d redis
```

## Launch influx serveur using docker
```
docker run -p 8083:8083 -p 8086:8086 --name influxdb -d influxdb
```

## Build in production

```bash
ENV=production make
```

## Run widget server in production

```bash
NODE_ENV=production node /home/node/articles-recommander/src/servers/widget.js
```