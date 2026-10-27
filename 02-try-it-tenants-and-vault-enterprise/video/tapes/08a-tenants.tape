# Step 7, split: the tenants. The Multi-Tenant Operator console's Tenants page
# shows acme and globex appear. (Its console was switched on before this beat.)
Source tapes/_setup.tape
Source tapes/_split.tape
Type "oc apply -f tenants.yaml" Enter
Wait+Screen /tenant.tenantoperator.stakater.com.globex (created|configured|unchanged)/
# Long enough for the console to show the change before the terminal stops.
Sleep 6s
