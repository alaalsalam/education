# Copyright (c) 2023, alaalsalam and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
# from frappe.model.naming import make_autoname
from frappe import _


class CommitteesSetting(Document):
	def after_insert(self):
		self.title = _("Committees Setting for Academic Year {0}".format(self.academic_term))
		self.save()
