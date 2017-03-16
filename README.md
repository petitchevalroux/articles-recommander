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

DROP CONTINUOUS QUERY "articles_click" ON "articles-recommender"

CREATE CONTINUOUS QUERY "articles_click" ON "articles-recommender"
BEGIN
    SELECT sum(count) AS click INTO articles FROM events WHERE action = 'click' GROUP BY time(1d),value
END

DROP CONTINUOUS QUERY "articles_display" ON "articles-recommender"

CREATE CONTINUOUS QUERY "articles_display" ON "articles-recommender"
BEGIN
    SELECT sum(count) AS display INTO articles FROM events WHERE action = 'display' GROUP BY time(1d),value
END

select sum(count) as click into articles from events where action='click' and time < now() group by time(1d),value
select sum(count) as display into articles from events where action='display' and time < now() group by time(1d),value
```

## Todo
 * Check if article exists before inserting in bin/fetch-articles.js
