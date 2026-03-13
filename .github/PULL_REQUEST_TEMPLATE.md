## New Entry Submission

**Entry directory:** `entries/api-{language}-{framework}/`
**Level:** v1 / v2 / v3

### Checklist

- [ ] Entry is under `entries/api-{language}-{framework}/`
- [ ] `entry.yaml` is present with correct level
- [ ] `Dockerfile` builds successfully
- [ ] Validator passes: `./validate/run.sh http://localhost:8080 --level {level}`
- [ ] No files modified outside `entries/`
- [ ] `README.md` included with brief description
- [ ] For v1/v2/v3: `db/schema.sql` and `db/seed-small.sql` copied to entry's `db/` directory
