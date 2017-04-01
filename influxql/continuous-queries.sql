DROP CONTINUOUS QUERY "daily_events_display" ON "articles-recommender";
CREATE CONTINUOUS QUERY "daily_events_display" ON "articles-recommender" RESAMPLE EVERY 1d FOR 1d BEGIN SELECT sum(count) as display INTO daily_events FROM events where action='display' group by time(1d) END;
DROP CONTINUOUS QUERY "daily_events_click" ON "articles-recommender";
CREATE CONTINUOUS QUERY "daily_events_click" ON "articles-recommender" RESAMPLE EVERY 1d FOR 1d BEGIN SELECT sum(count) as click INTO daily_events FROM events where action='click' group by time(1d) END;
DROP CONTINUOUS QUERY "articles_click" ON "articles-recommender";
CREATE CONTINUOUS QUERY "articles_click" ON "articles-recommender" RESAMPLE EVERY 1d FOR 1d BEGIN SELECT sum(count) AS click INTO articles FROM events WHERE action = 'click' GROUP BY time(1d),value END;
DROP CONTINUOUS QUERY "articles_display" ON "articles-recommender";
CREATE CONTINUOUS QUERY "articles_display" ON "articles-recommender" RESAMPLE EVERY 1d FOR 1d BEGIN SELECT sum(count) AS display INTO articles FROM events WHERE action = 'display' GROUP BY time(1d),value END;
