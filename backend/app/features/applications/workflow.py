# Application state machine.
# Defines allowed transitions and required fields per transition:
# submitted -> pre_checked -> survey_required -> surveyed
#   -> legal_review -> approved -> certificate_issued -> closed
# Alternative states: rejected, on_hold, missing_documents, under_objection
