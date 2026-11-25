# Tenancy across a fleet: targets a reader or CI can run.
#
#   make render   show what each environment's clusters receive, per team
#   make test     prove the overlays hold, without a cluster
#
# `make test` is the quick gate. The full proof is the tutorial's validation
# run on real clusters.

.PHONY: render test

render:
	@for team in acme globex; do for env in dev prod; do \
	  echo "## $$team, on $$env clusters:"; \
	  kubectl kustomize teams/$$team/overlays/$$env; echo; \
	done; done

test:
	@./test/render_test.sh
