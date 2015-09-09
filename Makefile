LOG_LEVEL = warning

run:
	@casperjs index.js --log-level=$(LOG_LEVEL)
