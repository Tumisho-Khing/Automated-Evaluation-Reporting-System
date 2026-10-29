# NTI-SignIN-system

QR-Based Student Attendance Management System

A web-based attendance management system designed to streamline student check-in and check-out, maintain attendance records, and provide administrators with a centralised interface for managing attendance activity.

This project demonstrates practical application development using modern web technologies, database integration, and workflow automation principles.

Portfolio and security notice: This repository is intended for demonstration and portfolio purposes. It must not contain production credentials, private student information, identity documents, or unauthorised copies of institutional data. The public version should use sanitised configuration and an isolated demonstration environment.

Overview

The system is designed to simplify attendance tracking by replacing manual attendance processes with a digital workflow.

Students can use a QR-based workflow to record attendance, while authorised staff can review attendance information through an administrative interface.

The project focuses on usability, structured record management, and reliable attendance workflows.

Key Features

QR-based attendance: Supports a QR-oriented workflow for student attendance recording.

Check-in and check-out: Records student arrival and departure activity.

Attendance history: Provides access to recorded attendance information.

Administrative dashboard: Offers a central interface for reviewing attendance activity.

Student record management: Organises student information used by the attendance workflow.

Duplicate check-in prevention: Designed to prevent repeated active check-ins within the same day.

Responsive interface: Built for use across desktop and mobile screen sizes.

Database integration: Uses Supabase for application data and related backend services.

Feature descriptions should be checked against the sanitised public version before publication.

Technology Stack

Technology

Purpose

React

User interface development

TypeScript

Type-safe application development

Vite

Development server and build tooling

Tailwind CSS

Interface styling

Supabase

Database and backend services

QR-based workflow

Attendance identification and recording

How It Works

Student identification: The attendance workflow identifies the student through the configured QR-based process.

Attendance recording: A check-in or check-out action initiates the corresponding attendance workflow.

Record management: Attendance activity is stored and associated with the relevant student record.

Administrative review: Staff use the dashboard to review attendance records and activity.

The exact workflow depends on the implementation and configuration included in the public demonstration.

Getting Started

Prerequisites

Node.js and npm

Git

A Supabase project for an isolated demonstration environment, if the application requires a live backend

Installation

Clone the public repository:

git clone <PUBLIC_REPOSITORY_URL>
cd nti-attendance-management-system

Install the dependencies:

npm install

Environment Configuration

If the application requires Supabase credentials, configure them using the environment-variable names documented in the project's sanitised .env.example file.

For a Vite application, client-side variables commonly use the VITE_ prefix.

Create a local .env file using the example as a template, then enter the credentials for your own demonstration Supabase project.

Do not commit .env files, service-role keys, database passwords, API secrets, or production credentials.

Run Locally

npm run dev

Build for Production

npm run build

The application should be tested locally before any deployment. Available commands should be verified against package.json.

Security Considerations

This project handles attendance-related information, so access control and data protection are important.

Before using the application with real data or deploying it:

Configure appropriate Supabase Row Level Security (RLS) policies.

Restrict access to student records and administrative functions.

Validate attendance requests and prevent unauthorised record modification.

Keep private credentials in environment variables or an appropriate secret manager.

Avoid publishing student names, contact information, identity documents, or real attendance records.

Use a separate demonstration database for the public portfolio version.

Client-side environment variables are visible to users in the browser. Only values explicitly intended for public client-side use should be placed there, and database access must still be protected by appropriate authorisation and RLS policies.

Project Goals

This project demonstrates experience with:

Building responsive web applications

Developing component-based interfaces with React and TypeScript

Integrating frontend applications with backend services

Designing digital attendance workflows

Managing structured application data

Considering security and access control in database-backed systems

Future Improvements

Potential enhancements include:

Attendance reports with date filters and export functionality

Improved role-based access controls

Attendance analytics and visual summaries

Automated notifications and reporting

Audit trails for attendance changes

More comprehensive validation and automated testing

These are potential enhancements, not claims that they are already implemented.

Portfolio Context

This repository is intended to showcase application development and systems integration skills through a practical attendance-management use case.

The public version should be sanitised and independently configurable, with no dependency on the original institution's production credentials or private student data.
