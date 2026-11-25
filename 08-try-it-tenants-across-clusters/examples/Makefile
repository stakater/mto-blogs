# Multi-cluster tenancy example — targets a reader or CI can run.
#
#   make render   show what each cluster would receive
#   make test     prove the pattern holds, without a cluster
#
# `make test` is the cheap, deterministic gate. The full proof is the
# tutorial's validation run on real clusters.

.PHONY: render render-dev render-prod test

render: render-dev render-prod

render-dev:
	@echo "## dev cluster receives:"
	@kubectl kustomize overlays/dev

render-prod:
	@echo "## prod cluster receives:"
	@kubectl kustomize overlays/prod

test:
	@./test/render_test.sh
