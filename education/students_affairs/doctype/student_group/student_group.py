# Copyright (c) 2015, Frappe Technologies and contributors
# For license information, please see license.txt


import frappe
from frappe import _
import json
from frappe.model.document import Document
from frappe.utils import cint

from education.education.utils import validate_duplicate_student


class StudentGroup(Document):
	def onload(self):
		if self.is_new():
			current_academic_year = frappe.db.get_single_value("Education Settings", "current_academic_year")
			self.set_onload("academic_year", current_academic_year)
  
	def on_trash(self):
		room = frappe.get_doc("Room",self.room)
		room.update({'used':0})
		room.update({'room_name':''})
		room.save()
  
	# def on_update(self):
		# frappe.msgprint("zizooo")
		

		
		# frappe.msgprint("<0_0>")
	def validate(self):
		self.validate_strength()
		self.validate_students()
		self.validate_and_set_child_table_fields()
		validate_duplicate_student(self.students)
		self.refresh_students_list()
		
		
	def refresh_students_list(self):
		updated = 0
		for en in self.students:
			student_enroll_group = frappe.get_doc("Program Enrollment",en.student)
			student_enroll_group.update({'student_group':en.student_group})
			if en.student_group != self.name:
				# sg = frappe.get_doc("Student Group",en.student_group)
				# frappe.msgprint(sg.name)
				# sg.update({'updated':1})
				frappe.db.set_value("Student Group",en.student_group ,'updated', 1)
				# sg.save()
				updated = 1
			
			# en.student_group = self.name
			student_enroll_group.save()

		if updated:
			self.updated = 1
			
		room = frappe.get_doc("Room",self.room)
		room.update({'used':1})
		room.update({'class_division':self.class_division})
		room.update({'room_name':self.name})
		room.save()

	def validate_strength(self):
		if cint(self.max_strength) < 0:
			frappe.throw(_("""Max strength cannot be less than zero."""))
		if self.max_strength and len(self.students) > self.max_strength:
			frappe.throw(
				_("""Cannot enroll more than {0} students for this student group.""").format(
					self.max_strength
				)
			)

	def validate_students(self):
		program_enrollment = get_program_enrollment(
			self.academic_year,
			self.academic_term,
			self.program,
			# self.student_category,
		)
		students = [d.student for d in program_enrollment] if program_enrollment else []
		# for d in self.students:
		#	# pass
		#	if (
		#		not frappe.db.get_value("Student", d.student, "enabled")
		#		or not d.active
		#		and not self.disabled
		#	):
		#		frappe.throw(
		#			_("{0} - {1} is inactive student").format(d.group_roll_number, d.student_name)
		#		)


	def validate_and_set_child_table_fields(self):
		roll_numbers = [d.group_roll_number for d in self.students if d.group_roll_number]
		max_roll_no = max(roll_numbers) if roll_numbers else 0
		roll_no_list = []
		for d in self.students:
			if not d.student_name:
				d.student_name = frappe.db.get_value("Program Enrollment", d.student, "student")
			if not d.group_roll_number:
				max_roll_no += 1
				d.group_roll_number = max_roll_no
			if d.group_roll_number in roll_no_list:
				frappe.throw(_("Duplicate roll number for student {0}").format(d.student_name))
			else:
				roll_no_list.append(d.group_roll_number)


@frappe.whitelist()
def get_students(
	academic_year,
	academic_term=None,
	program=None,
	student_group=None,
	student_category=None,
):
	enrolled_students = get_program_enrollment(
		academic_year, academic_term, program,  student_category,student_group,
	)
	
	if enrolled_students:
		student_list = []
		for s in enrolled_students:
			if frappe.db.get_value("Student", s.student, "enabled"):
				student_list.append(s)
				s.update({"active": 1})
			else:
				s.update({"active": 0})
			
		return student_list
	else:
		frappe.msgprint(_("No students found"))
		return []

@frappe.whitelist()
def get_program_enrollment(
	academic_year,
	academic_term=None,
	program=None,
	student_group=None,
	student_category=None,
	get_all_enroll=None,
): 
	condition1 = " "
	if academic_term:
		condition1 += " and pe.academic_term = %(academic_term)s"
	if program:
		condition1 += " and pe.program = %(program)s"
	if student_category:
		condition1 += " and pe.student_category = %(student_category)s"
	if not get_all_enroll:
		if student_group:
			condition1 += " and pe.student_group =  %(student_group)s "
		else:
			condition1 += " and pe.student_group is null "
	
	return frappe.db.sql(
		"""
		select
			pe.name ,pe.student, pe.student_name, pe.student_group
		from `tabProgram Enrollment` pe 
		where
			pe.academic_year = %(academic_year)s  
			and pe.docstatus = 1 {condition1}
		order by
			pe.student_name asc
		""".format(
			condition1=condition1,
		),
		(
			{
				"academic_year": academic_year,
				"academic_term": academic_term,
				"program": program,
				"student_category": student_category,
				"student_group":student_group,
			}
		),
		as_dict=1,
	)


@frappe.whitelist()
@frappe.validate_and_sanitize_search_inputs
def fetch_students(doctype, txt, searchfield, start, page_len, filters):
	enrolled_students = get_program_enrollment(
		filters.get("academic_year"),
		filters.get("academic_term"),
		filters.get("program"),
		# filters.get("student_category"),
		# get_all_enroll = 1,
	)	
	student_group_student = frappe.db.sql_list(
		"""select student from `tabStudent Group Student` where parent=%s""",
		(filters.get("student_group")),
	)
	student_group_student = []
	students = (
		[d.name for d in enrolled_students if d.name not in student_group_student]
		if enrolled_students
		else [""]
	) or [""]
	return frappe.db.sql(
		"""select name, student_name from `tabProgram Enrollment`
		where name in ({0}) and (`{1}` LIKE %s or student_name LIKE %s)
		order by idx desc, name
		limit %s, %s""".format(
			", ".join(["%s"] * len(students)), searchfield
		),
		tuple(students + ["%%%s%%" % txt, "%%%s%%" % txt, start, page_len]),
	)
