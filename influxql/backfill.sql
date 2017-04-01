-- Queries to backfill continuous queries
SELECT sum(count) as display INTO daily_events FROM events where action='display' and time < now() - 1d group by time(1d);
SELECT sum(count) as click INTO daily_events FROM events where action='click' and time < now() - 1d group by time(1d);
select sum(count) as click into articles from events where action='click' and time < now() - 1d group by time(1d),value;
select sum(count) as display into articles from events where action='display' and time < now() - 1d group by time(1d),value;