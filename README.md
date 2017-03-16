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

## Influx continues queries
daily_events contains click and display per day
```
CREATE CONTINUOUS QUERY "daily_events_display" ON "articles-recommender"
BEGIN
  SELECT sum(count) as display INTO daily_events FROM events where action='display' group by time(1d)
END

CREATE CONTINUOUS QUERY "daily_events_click" ON "articles-recommender"
BEGIN
  SELECT sum(count) as click INTO daily_events FROM events where action='click' group by time(1d)
END
```

## Todo
 * Check if article exists before inserting in bin/fetch-articles.js
