# Copyright (c) 2023, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

import calendar

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, getdate

from education.education.utils import OverlapError


from frappe.model.document import Document

class SchedulingTool(Document):
	@frappe.whitelist()
	def schedule_course(self, days):
		"""Creates course schedules as per specified parameters"""

		course_schedules = []
		course_schedules_errors = []
		rescheduled = []
		reschedule_errors = []

		self.validate_mandatory(days)
		self.validate_date()
		self.instructor_name = frappe.db.get_value(
			"Instructor", self.instructor, "instructor_name"
		)

		group_based_on, course = frappe.db.get_value(
			"Student Group", self.student_group, ["group_based_on", "course"]
		)

		if group_based_on == "Course":
			self.course = course

		if self.reschedule:
			rescheduled, reschedule_errors = self.delete_course_schedule(
				rescheduled, reschedule_errors, days
			)

		date = self.course_start_date
		while date < self.course_end_date:
			if calendar.day_name[getdate(date).weekday()] in days:
				course_schedule = self.make_course_schedule(date)
				try:
					course_schedule.save()
				except OverlapError:
					course_schedules_errors.append(date)
				else:
					course_schedules.append(course_schedule)

			date = add_days(date, 1)

		return dict(
			course_schedules=course_schedules,
			course_schedules_errors=course_schedules_errors,
			rescheduled=rescheduled,
			reschedule_errors=reschedule_errors,
		)

	def validate_mandatory(self, days):
		"""Validates all mandatory fields"""
		if not days:
			frappe.throw(_("Please select at least one day to schedule the course."))
		fields = [
			"course",
			"room",
			"instructor",
			"from_time",
			"to_time",
			"course_start_date",
			"course_end_date",
		]
		for d in fields:
			if not self.get(d):
				frappe.throw(_("{0} is mandatory").format(self.meta.get_label(d)))

	def validate_date(self):
		"""Validates if Course Start Date is greater than Course End Date"""
		if self.course_start_date > self.course_end_date:
			frappe.throw(_("Course Start Date cannot be greater than Course End Date."))

	def delete_course_schedule(self, rescheduled, reschedule_errors, days):
		"""Delete all course schedule within the Date range and specified filters"""
		schedules = frappe.get_list(
			"Course Schedule",
			fields=["name", "schedule_date"],
			filters=[
				["student_group", "=", self.student_group],
				["course", "=", self.course],
				["schedule_date", ">=", self.course_start_date],
				["schedule_date", "<=", self.course_end_date],
			],
		)

		for d in schedules:
			try:
				if calendar.day_name[getdate(d.schedule_date).weekday()] in days:
					frappe.delete_doc("Course Schedule", d.name)
					rescheduled.append(d.name)
			except Exception:
				reschedule_errors.append(d.name)
		return rescheduled, reschedule_errors

	def make_course_schedule(self, date):
		"""Makes a new Course Schedule.
		:param date: Date on which Course Schedule will be created."""
		course_schedule = frappe.new_doc("Course Schedule")
		course_schedule.student_group = self.student_group
		course_schedule.course = self.course
		course_schedule.instructor = self.instructor
		course_schedule.instructor_name = self.instructor_name
		course_schedule.room = self.room
		course_schedule.schedule_date = date
		course_schedule.from_time = self.from_time
		course_schedule.to_time = self.to_time
		return course_schedule



	@frappe.whitelist()
	def schedule_table_course(self):
		"""Creates course schedules as per specified parameters"""

		course_schedules = []
		course_schedules_errors = []
		rescheduled = []
		reschedule_errors = []
		for row in self.scheduling_table:
			self.validate_date()
			row.instructor_name = frappe.db.get_value(
				"Instructor", row.instructor, "instructor_name"
			)
			if self.reschedule:
				rescheduled, reschedule_errors = self.delete_row_course_schedule( row,
					rescheduled, reschedule_errors
				)
			date = self.course_start_date
			while date < self.course_end_date:
				frappe.msgprint("--->" +str(row.days))
				if calendar.day_name[getdate(date).weekday()] == row.days:
					frappe.msgprint(str(row.course))
					course_schedule = self.make_row_course_schedule(row,date)
					try:
						course_schedule.save()
					except OverlapError:
						course_schedules_errors.append(date)
					else:
						course_schedules.append(course_schedule)

				date = add_days(date, 1)

		return dict(
			course_schedules=course_schedules,
			course_schedules_errors=course_schedules_errors,
			rescheduled=rescheduled,
			reschedule_errors=reschedule_errors,
		)

	def validate_row_mandatory():
		"""Validates all mandatory fields"""
		if not row.course:
			frappe.throw(_("Please select at least one day to schedule the course."))
		fields = [
			"course",
			"room",
			"instructor",
			"from_time",
			"to_time",
			"course_start_date",
			"course_end_date",
		]
		for d in fields:
			if not row.get(d):
				frappe.throw(_("{0} is mandatory").format(row.meta.get_label(d)))
    
    
	def delete_row_course_schedule(self,row ,rescheduled, reschedule_errors):
		"""Delete all course schedule within the Date range and specified filters"""
		schedules = frappe.get_list(
			"Course Schedule",
			fields=["name", "schedule_date"],
			filters=[
				["student_group", "=", row.student_group],
				["course", "=", row.course],
				["schedule_date", ">=", self.course_start_date],
				["schedule_date", "<=", self.course_end_date],
			],
		)

		for d in schedules:
			try:
				if calendar.day_name[getdate(d.schedule_date).weekday()] == row.days:
					frappe.delete_doc("Course Schedule", d.name)
					rescheduled.append(d.name)
			except Exception:
				reschedule_errors.append(d.name)
		return rescheduled, reschedule_errors


	def make_row_course_schedule(self,row, date):
		"""Makes a new Course Schedule.
		:param date: Date on which Course Schedule will be created."""
		course_schedule = frappe.new_doc("Course Schedule")
		course_schedule.student_group = row.student_group
		course_schedule.course = row.course
		course_schedule.instructor = row.instructor
		course_schedule.instructor_name = row.instructor_name
		course_schedule.room = row.room
		course_schedule.schedule_date = date
		course_schedule.from_time = row.from_time
		course_schedule.to_time = row.to_time
		return course_schedule


