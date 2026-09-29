--
-- PostgreSQL database dump
--

\restrict QeWWVnzUbVbfnFrNJFwhBCJx6tVgo0Ei9kERofa9vs7ioyOP7kFCshxUk1b3zgJ

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.resources VALUES (2, 'Conference Room Beta', 'MEETING_ROOM', 'Block A - Floor 1', 6, 'AVAILABLE', 'Medium meeting room', '2026-09-29 21:35:29.257005');
INSERT INTO public.resources VALUES (3, 'Innovation Lab', 'LAB', 'Block B - Floor 3', 30, 'AVAILABLE', 'Collaborative innovation and development space', '2026-09-29 21:35:29.257005');
INSERT INTO public.resources VALUES (4, 'Training Room 1', 'TRAINING_ROOM', 'Block C - Floor 1', 25, 'AVAILABLE', 'Training and workshop room', '2026-09-29 21:35:29.257005');
INSERT INTO public.resources VALUES (5, 'Projector 01', 'EQUIPMENT', 'Equipment Store', 1, 'AVAILABLE', '4K wireless projector', '2026-09-29 21:35:29.257005');
INSERT INTO public.resources VALUES (6, 'MacBook Pro 01', 'LAPTOP', 'IT Store', 1, 'AVAILABLE', 'MacBook Pro development machine', '2026-09-29 21:35:29.257005');
INSERT INTO public.resources VALUES (7, 'Dell Precision 01', 'LAPTOP', 'IT Store', 1, 'AVAILABLE', 'High performance workstation', '2026-09-29 21:35:29.257005');
INSERT INTO public.resources VALUES (8, 'Executive Conference Room', 'MEETING_ROOM', 'Block A - Floor 4', 20, 'AVAILABLE', 'Executive meeting and presentation room', '2026-09-29 21:35:29.257005');
INSERT INTO public.resources VALUES (9, 'Smart Collaboration Room', 'MEETING_ROOM', 'Block D - Floor 2', 20, 'AVAILABLE', 'AI-enabled smart collaboration room with presentation system', '2026-09-29 21:45:32.947028');
INSERT INTO public.resources VALUES (1, 'Conference Room Alpha', 'MEETING_ROOM', 'Block A - Floor 2', 12, 'ALLOCATED', 'Large conference room with display and video conferencing', '2026-09-29 21:35:29.257005');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.users VALUES (3, 'Rahul Sharma', 'rahul@nexus.com', 'EMPLOYEE', '2026-09-29 21:35:26.729921', NULL, NULL);
INSERT INTO public.users VALUES (4, 'Priya Kumar', 'priya@nexus.com', 'EMPLOYEE', '2026-09-29 21:35:26.729921', NULL, NULL);
INSERT INTO public.users VALUES (5, 'Arjun Mehta', 'arjun@nexus.com', 'EMPLOYEE', '2026-09-29 21:35:26.729921', NULL, NULL);
INSERT INTO public.users VALUES (6, 'Test Employee', 'test@nexus.com', 'EMPLOYEE', '2026-09-29 23:06:58.242903', NULL, '$2b$10$ZmwMrwJG8DatQgEp4VVwiO/E5Cr4Djs.LlM49QRJ3GVifhkdcO7dy');
INSERT INTO public.users VALUES (1, 'Admin User', 'admin@nexus.com', 'ADMIN', '2026-09-29 21:35:26.729921', NULL, '$2b$10$GvoNka21XOKgodnEmO6MIuCaJesZpuEjNbSOmJpVYlQ2WQVLnQk2K');
INSERT INTO public.users VALUES (2, 'Operations Manager', 'manager@nexus.com', 'MANAGER', '2026-09-29 21:35:26.729921', NULL, '$2b$10$3fOAOiAXgV/XqmyqwVJbjOTEAdWSvydIetSkT7zu8O0jUsts6yAuW');
INSERT INTO public.users VALUES (7, 'Eshan', 'esharha2006@gmail.com', 'EMPLOYEE', '2026-09-29 23:39:56.110138', '101653205334824636665', NULL);


--
-- Data for Name: allocation_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.allocation_requests VALUES (1, 3, 1, '2026-10-01 10:00:00', '2026-10-01 12:00:00', 'AI project team meeting', 'APPROVED', '2026-09-29 21:52:30.134433');
INSERT INTO public.allocation_requests VALUES (2, 3, 2, '2026-09-30 08:16:00', '2026-09-30 09:32:00', 'AI Conference', 'REJECTED', '2026-09-29 22:17:11.591254');
INSERT INTO public.allocation_requests VALUES (3, 2, 1, '2026-09-29 23:31:00', '2026-09-30 00:33:00', 'Team Meet
', 'PENDING', '2026-09-29 23:32:32.672904');


--
-- Data for Name: allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.allocations VALUES (1, 1, 1, 3, '2026-10-01 10:00:00', '2026-10-01 12:00:00', 'ACTIVE', '2026-09-29 21:53:43.122128');


--
-- Data for Name: resource_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: allocation_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.allocation_requests_id_seq', 3, true);


--
-- Name: allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.allocations_id_seq', 1, true);


--
-- Name: resource_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resource_history_id_seq', 1, false);


--
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resources_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- PostgreSQL database dump complete
--

\unrestrict QeWWVnzUbVbfnFrNJFwhBCJx6tVgo0Ei9kERofa9vs7ioyOP7kFCshxUk1b3zgJ

