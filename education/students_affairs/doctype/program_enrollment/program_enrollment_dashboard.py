from frappe import _


def get_data():
	return {
		"fieldname": "program_enrollment",
		"transactions": [
			{"label": _("Fee"), "items": [ "Fees"]}
		],
		"reports": [
			{"label": _("Report"), "items": ["Student and Guardian Contact Details"]}
		],
	}
