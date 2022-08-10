select *
from pg_stat_activity
where datname = current_database();

