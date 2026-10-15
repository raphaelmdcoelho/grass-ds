#!/usr/bin/env bash
# Claude Code status line: token usage, context limit, and a plan-usage battery.
# Battery: 5 cells, one per 20% of the current plan's 5-hour usage limit.
#   |_|_|_|_|_|  0-19%    |x|_|_|_|_|  20-39%   ...   |x|x|x|x|x|  100%

input=$(cat)

# Tokens in the context window / context window limit.
# Input-only (input + cache reads/writes), the same basis as used_percentage;
# adding total_output_tokens would make the count disagree with the percentage.
used=$(jq -r '.context_window.total_input_tokens // 0' <<<"$input")
limit=$(jq -r '.context_window.context_window_size // 200000' <<<"$input")
ctx_pct=$(jq -r '.context_window.used_percentage // empty' <<<"$input")
# used_percentage can be null early in a session; derive it when tokens are known
if [ -z "$ctx_pct" ] && [ "$used" -gt 0 ] 2>/dev/null; then
  ctx_pct=$(( used * 100 / limit ))
fi
model=$(jq -r '.model.display_name // "Claude"' <<<"$input")

# Plan usage (subscription rate limits); prefer 5-hour window, fall back to 7-day
plan_pct=$(jq -r '.rate_limits.five_hour.used_percentage // .rate_limits.seven_day.used_percentage // empty' <<<"$input")

human() {
  awk -v n="$1" 'BEGIN {
    if (n >= 1000000) printf "%.1fM", n/1000000;
    else if (n >= 1000) printf "%.1fk", n/1000;
    else printf "%d", n }'
}

battery() {
  local pct=${1%.*} filled i out="|"
  filled=$(( pct / 20 )); (( filled > 5 )) && filled=5; (( filled < 0 )) && filled=0
  for i in 1 2 3 4 5; do
    if (( i <= filled )); then out+="x|"; else out+="_|"; fi
  done
  printf '%s' "$out"
}

line="$model | tokens: $(human "$used")/$(human "$limit")"
[ -n "$ctx_pct" ] && line+=" (${ctx_pct%.*}% ctx)"

if [ -n "$plan_pct" ]; then
  line+=" | plan: $(battery "$plan_pct") ${plan_pct%.*}%"
else
  line+=" | plan: $(battery 0) n/a"
fi

printf '%s\n' "$line"
