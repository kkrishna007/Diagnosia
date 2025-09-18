--
-- PostgreSQL database dump
--

\restrict PQuZYLml4CwR8y2hBrqRF6CoyMlfVwBY9ECu53SwmPheRgigXi7xZuv6O0Yi2KN

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointment_tests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointment_tests (
    appointment_test_id integer NOT NULL,
    appointment_id integer,
    test_code character varying(50),
    test_price numeric(10,2) NOT NULL,
    patient_name character varying(255) NOT NULL,
    patient_age integer NOT NULL,
    patient_gender character varying(10) NOT NULL,
    status character varying(20) DEFAULT 'booked'::character varying,
    CONSTRAINT appointment_tests_patient_gender_check CHECK (((patient_gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.appointment_tests OWNER TO postgres;

--
-- Name: appointment_tests_appointment_test_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointment_tests_appointment_test_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointment_tests_appointment_test_id_seq OWNER TO postgres;

--
-- Name: appointment_tests_appointment_test_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointment_tests_appointment_test_id_seq OWNED BY public.appointment_tests.appointment_test_id;


--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    appointment_id integer NOT NULL,
    patient_id integer,
    appointment_date date NOT NULL,
    appointment_time time without time zone NOT NULL,
    appointment_type character varying(20) NOT NULL,
    collection_address_id integer,
    status character varying(20) DEFAULT 'booked'::character varying,
    total_amount numeric(10,2) NOT NULL,
    special_instructions text,
    cancellation_reason text,
    cancelled_by integer,
    cancelled_at timestamp without time zone,
    rescheduled_from integer,
    rescheduled_reason text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT appointments_appointment_type_check CHECK (((appointment_type)::text = ANY ((ARRAY['lab_visit'::character varying, 'home_collection'::character varying])::text[])))
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_appointment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_appointment_id_seq OWNER TO postgres;

--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_appointment_id_seq OWNED BY public.appointments.appointment_id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    log_id integer NOT NULL,
    user_id integer,
    action character varying(100) NOT NULL,
    entity_type character varying(100) NOT NULL,
    entity_id integer,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    "timestamp" timestamp without time zone DEFAULT now(),
    session_id character varying(255)
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audit_logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_log_id_seq OWNER TO postgres;

--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audit_logs_log_id_seq OWNED BY public.audit_logs.log_id;


--
-- Name: chatbot_conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chatbot_conversations (
    conversation_id integer NOT NULL,
    user_id integer,
    session_id character varying(255) NOT NULL,
    started_at timestamp without time zone DEFAULT now(),
    ended_at timestamp without time zone,
    status character varying(20) DEFAULT 'active'::character varying,
    escalated_to integer,
    satisfaction_rating integer,
    feedback text
);


ALTER TABLE public.chatbot_conversations OWNER TO postgres;

--
-- Name: chatbot_conversations_conversation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chatbot_conversations_conversation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chatbot_conversations_conversation_id_seq OWNER TO postgres;

--
-- Name: chatbot_conversations_conversation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chatbot_conversations_conversation_id_seq OWNED BY public.chatbot_conversations.conversation_id;


--
-- Name: chatbot_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chatbot_messages (
    message_id integer NOT NULL,
    conversation_id integer,
    sender_type character varying(10) NOT NULL,
    message_text text NOT NULL,
    intent character varying(100),
    confidence_score numeric(5,4),
    response_time_ms integer,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT chatbot_messages_sender_type_check CHECK (((sender_type)::text = ANY ((ARRAY['user'::character varying, 'bot'::character varying, 'agent'::character varying])::text[])))
);


ALTER TABLE public.chatbot_messages OWNER TO postgres;

--
-- Name: chatbot_messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chatbot_messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chatbot_messages_message_id_seq OWNER TO postgres;

--
-- Name: chatbot_messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chatbot_messages_message_id_seq OWNED BY public.chatbot_messages.message_id;


--
-- Name: collectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.collectors (
    user_id integer NOT NULL,
    collector_type character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT collectors_collector_type_check CHECK (((collector_type)::text = ANY ((ARRAY['home_collection'::character varying, 'lab_visit'::character varying, 'both'::character varying])::text[])))
);


ALTER TABLE public.collectors OWNER TO postgres;

--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_templates (
    template_id integer NOT NULL,
    template_name character varying(100) NOT NULL,
    event_trigger character varying(100) NOT NULL,
    subject_template character varying(500),
    body_template text NOT NULL,
    variables jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notification_templates OWNER TO postgres;

--
-- Name: notification_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notification_templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_templates_template_id_seq OWNER TO postgres;

--
-- Name: notification_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notification_templates_template_id_seq OWNED BY public.notification_templates.template_id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    user_id integer,
    template_id integer,
    subject character varying(500),
    message text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    priority character varying(10) DEFAULT 'normal'::character varying,
    related_entity_type character varying(50),
    related_entity_id integer,
    scheduled_at timestamp without time zone,
    sent_at timestamp without time zone,
    delivered_at timestamp without time zone,
    failure_reason text,
    retry_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notification_id_seq OWNER TO postgres;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    method_id integer NOT NULL,
    method_name character varying(100) NOT NULL,
    method_type character varying(20) NOT NULL,
    is_active boolean DEFAULT true,
    CONSTRAINT payment_methods_method_type_check CHECK (((method_type)::text = ANY ((ARRAY['online'::character varying, 'cash'::character varying, 'card'::character varying, 'wallet'::character varying, 'upi'::character varying])::text[])))
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- Name: payment_methods_method_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_methods_method_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_methods_method_id_seq OWNER TO postgres;

--
-- Name: payment_methods_method_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_methods_method_id_seq OWNED BY public.payment_methods.method_id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    payment_reference character varying(100) NOT NULL,
    appointment_id integer,
    user_id integer,
    payment_method_id integer,
    amount numeric(10,2) NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying,
    payment_status character varying(20) DEFAULT 'success'::character varying,
    gateway_response jsonb,
    transaction_id character varying(100),
    completed_at timestamp without time zone DEFAULT now(),
    failure_reason text,
    refund_amount numeric(10,2) DEFAULT 0,
    refund_reason text,
    refunded_at timestamp without time zone
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_payment_id_seq OWNER TO postgres;

--
-- Name: payments_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_payment_id_seq OWNED BY public.payments.payment_id;


--
-- Name: samples; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.samples (
    sample_id integer NOT NULL,
    sample_code character varying(50) NOT NULL,
    appointment_test_id integer,
    collected_by integer,
    collected_at timestamp without time zone,
    collection_method character varying(100),
    sample_quality character varying(20),
    storage_location character varying(100),
    temperature_maintained boolean DEFAULT true,
    received_by_lab integer,
    received_at timestamp without time zone,
    processing_started_at timestamp without time zone,
    processing_completed_at timestamp without time zone,
    status character varying(20) DEFAULT 'collected'::character varying,
    rejection_reason text,
    notes text
);


ALTER TABLE public.samples OWNER TO postgres;

--
-- Name: samples_sample_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.samples_sample_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.samples_sample_id_seq OWNER TO postgres;

--
-- Name: samples_sample_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.samples_sample_id_seq OWNED BY public.samples.sample_id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    setting_id integer NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text,
    setting_type character varying(20) DEFAULT 'string'::character varying,
    description text,
    category character varying(100),
    is_public boolean DEFAULT false,
    updated_by integer,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: system_settings_setting_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_settings_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_setting_id_seq OWNER TO postgres;

--
-- Name: system_settings_setting_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_settings_setting_id_seq OWNED BY public.system_settings.setting_id;


--
-- Name: test_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_categories (
    category_id integer NOT NULL,
    category_name character varying(100) NOT NULL,
    category_description text,
    category_icon character varying(255)
);


ALTER TABLE public.test_categories OWNER TO postgres;

--
-- Name: test_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_categories_category_id_seq OWNER TO postgres;

--
-- Name: test_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_categories_category_id_seq OWNED BY public.test_categories.category_id;


--
-- Name: test_panels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_panels (
    panel_id integer NOT NULL,
    test_code character varying(100) NOT NULL,
    panel_json jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.test_panels OWNER TO postgres;

--
-- Name: test_panels_panel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_panels_panel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_panels_panel_id_seq OWNER TO postgres;

--
-- Name: test_panels_panel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_panels_panel_id_seq OWNED BY public.test_panels.panel_id;


--
-- Name: test_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_reports (
    report_id integer NOT NULL,
    appointment_id integer,
    report_number character varying(50) NOT NULL,
    report_date date NOT NULL,
    report_type character varying(20) NOT NULL,
    report_file_path character varying(500),
    report_file_name character varying(255),
    file_size_kb integer,
    generated_by integer,
    approved_by integer,
    patient_notified boolean DEFAULT false,
    patient_downloaded boolean DEFAULT false,
    download_count integer DEFAULT 0,
    first_downloaded_at timestamp without time zone,
    last_downloaded_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT test_reports_report_type_check CHECK (((report_type)::text = ANY ((ARRAY['individual'::character varying, 'consolidated'::character varying])::text[])))
);


ALTER TABLE public.test_reports OWNER TO postgres;

--
-- Name: test_reports_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_reports_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_reports_report_id_seq OWNER TO postgres;

--
-- Name: test_reports_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_reports_report_id_seq OWNED BY public.test_reports.report_id;


--
-- Name: test_results; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.test_results (
    result_id integer NOT NULL,
    sample_id integer,
    test_code character varying(50),
    processed_by integer,
    verified_by integer,
    result_values jsonb NOT NULL,
    reference_ranges jsonb,
    abnormal_flags jsonb,
    interpretation text,
    recommendations text,
    critical_values boolean DEFAULT false,
    result_status character varying(20) DEFAULT 'draft'::character varying,
    processed_at timestamp without time zone DEFAULT now(),
    verified_at timestamp without time zone,
    released_at timestamp without time zone,
    amended_reason text,
    notes text,
    appointment_test_id integer
);


ALTER TABLE public.test_results OWNER TO postgres;

--
-- Name: test_results_result_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.test_results_result_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.test_results_result_id_seq OWNER TO postgres;

--
-- Name: test_results_result_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.test_results_result_id_seq OWNED BY public.test_results.result_id;


--
-- Name: tests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tests (
    test_code character varying(50) NOT NULL,
    test_name character varying(255) NOT NULL,
    test_description text,
    category_id integer,
    base_price numeric(10,2) NOT NULL,
    duration_hours integer NOT NULL,
    preparation_instructions text,
    sample_type character varying(100) NOT NULL,
    fasting_required boolean DEFAULT false,
    fasting_hours integer,
    gender_specific character varying(20),
    report_time_hours integer
);


ALTER TABLE public.tests OWNER TO postgres;

--
-- Name: user_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_addresses (
    address_id integer NOT NULL,
    user_id integer,
    address character varying(500) NOT NULL
);


ALTER TABLE public.user_addresses OWNER TO postgres;

--
-- Name: user_addresses_address_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_addresses_address_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_addresses_address_id_seq OWNER TO postgres;

--
-- Name: user_addresses_address_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_addresses_address_id_seq OWNED BY public.user_addresses.address_id;


--
-- Name: user_role_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_role_assignments (
    user_id integer NOT NULL,
    role_id integer NOT NULL
);


ALTER TABLE public.user_role_assignments OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    role_id integer NOT NULL,
    role_name character varying(50) NOT NULL,
    role_description text
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_role_id_seq OWNER TO postgres;

--
-- Name: user_roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_roles_role_id_seq OWNED BY public.user_roles.role_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    date_of_birth date NOT NULL,
    gender character varying(10) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT users_gender_check CHECK (((gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: appointment_tests appointment_test_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_tests ALTER COLUMN appointment_test_id SET DEFAULT nextval('public.appointment_tests_appointment_test_id_seq'::regclass);


--
-- Name: appointments appointment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN appointment_id SET DEFAULT nextval('public.appointments_appointment_id_seq'::regclass);


--
-- Name: audit_logs log_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN log_id SET DEFAULT nextval('public.audit_logs_log_id_seq'::regclass);


--
-- Name: chatbot_conversations conversation_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatbot_conversations ALTER COLUMN conversation_id SET DEFAULT nextval('public.chatbot_conversations_conversation_id_seq'::regclass);


--
-- Name: chatbot_messages message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatbot_messages ALTER COLUMN message_id SET DEFAULT nextval('public.chatbot_messages_message_id_seq'::regclass);


--
-- Name: notification_templates template_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates ALTER COLUMN template_id SET DEFAULT nextval('public.notification_templates_template_id_seq'::regclass);


--
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- Name: payment_methods method_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN method_id SET DEFAULT nextval('public.payment_methods_method_id_seq'::regclass);


--
-- Name: payments payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN payment_id SET DEFAULT nextval('public.payments_payment_id_seq'::regclass);


--
-- Name: samples sample_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.samples ALTER COLUMN sample_id SET DEFAULT nextval('public.samples_sample_id_seq'::regclass);


--
-- Name: system_settings setting_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN setting_id SET DEFAULT nextval('public.system_settings_setting_id_seq'::regclass);


--
-- Name: test_categories category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_categories ALTER COLUMN category_id SET DEFAULT nextval('public.test_categories_category_id_seq'::regclass);


--
-- Name: test_panels panel_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_panels ALTER COLUMN panel_id SET DEFAULT nextval('public.test_panels_panel_id_seq'::regclass);


--
-- Name: test_reports report_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_reports ALTER COLUMN report_id SET DEFAULT nextval('public.test_reports_report_id_seq'::regclass);


--
-- Name: test_results result_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results ALTER COLUMN result_id SET DEFAULT nextval('public.test_results_result_id_seq'::regclass);


--
-- Name: user_addresses address_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_addresses ALTER COLUMN address_id SET DEFAULT nextval('public.user_addresses_address_id_seq'::regclass);


--
-- Name: user_roles role_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN role_id SET DEFAULT nextval('public.user_roles_role_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: appointment_tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointment_tests (appointment_test_id, appointment_id, test_code, test_price, patient_name, patient_age, patient_gender, status) FROM stdin;
49	49	IRON	800.00	Kkrishna Saxena	21	male	reported
50	50	IRON	800.00	Kkrishna Saxena	21	male	cancelled
51	51	LIPID	450.00	Kkrishna Saxena	21	male	sample_collected
52	52	LIPID	450.00	Kkrishna Saxena	21	male	sample_collected
53	53	HEALTHPKG	2500.00	Kkrishna Saxena	21	male	sample_collected
54	54	CBC	350.00	Kkrishna Saxena	21	male	booked
55	55	CBC	350.00	Kkrishna Saxena	21	male	booked
56	56	CBC	350.00	Kkrishna Saxena	21	male	booked
57	57	CBC	350.00	Kkrishna Saxena	21	male	booked
58	58	DIABPKG	800.00	Kkrishna Saxena	21	male	booked
59	59	VITD	1200.00	Kkrishna Saxena	21	male	booked
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (appointment_id, patient_id, appointment_date, appointment_time, appointment_type, collection_address_id, status, total_amount, special_instructions, cancellation_reason, cancelled_by, cancelled_at, rescheduled_from, rescheduled_reason, created_at, updated_at) FROM stdin;
56	79	2025-09-17	12:00:00	home_collection	\N	booked	650.00	Collection Address: It's Rajat Niwas, Ghaziabad, Uttar Pradesh	\N	\N	\N	\N	\N	2025-09-16 22:02:04.725132	2025-09-16 22:02:04.725132
57	79	2025-09-17	12:00:00	home_collection	\N	booked	650.00	Collection Address: it's Rajat Niwas, Vaishali, ghaziabad	\N	\N	\N	\N	\N	2025-09-16 22:04:36.89909	2025-09-16 22:04:36.89909
58	79	2025-09-20	08:00:00	lab_visit	\N	booked	800.00		\N	\N	\N	\N	\N	2025-09-16 22:16:20.191594	2025-09-16 22:16:20.191594
59	79	2025-09-17	14:00:00	lab_visit	\N	booked	1200.00		\N	\N	\N	\N	\N	2025-09-16 22:35:40.552645	2025-09-16 22:35:40.552645
49	79	2025-09-16	14:00:00	home_collection	\N	completed	1100.00	Collection Address: ABC TOWER, DELHI	\N	\N	\N	\N	\N	2025-09-15 16:08:11.31645	2025-09-15 16:08:11.31645
50	79	2025-09-17	14:00:00	home_collection	\N	cancelled	1100.00	Collection Address: ABCD	\N	79	2025-09-15 16:18:02.220755	\N	\N	2025-09-15 16:17:57.567891	2025-09-15 16:17:57.567891
51	79	2025-09-18	16:00:00	lab_visit	\N	sample_collected	450.00		\N	\N	\N	\N	\N	2025-09-15 16:18:24.968545	2025-09-15 16:18:35.235366
52	79	2025-09-17	06:00:00	lab_visit	\N	sample_collected	450.00		\N	\N	\N	\N	\N	2025-09-16 15:18:18.248758	2025-09-16 15:18:18.248758
53	79	2025-09-17	14:00:00	lab_visit	\N	sample_collected	2500.00		\N	\N	\N	\N	\N	2025-09-16 15:45:00.081339	2025-09-16 15:45:00.081339
54	79	2025-09-17	12:00:00	home_collection	\N	booked	650.00	Home collection requested	\N	\N	\N	\N	\N	2025-09-16 17:36:33.098524	2025-09-16 17:36:33.098524
55	79	2025-09-17	12:00:00	home_collection	\N	booked	650.00	Collection Address: A-1, ABC Apartment, Rohini	\N	\N	\N	\N	\N	2025-09-16 17:52:05.516349	2025-09-16 17:52:05.516349
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audit_logs (log_id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, "timestamp", session_id) FROM stdin;
\.


--
-- Data for Name: chatbot_conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chatbot_conversations (conversation_id, user_id, session_id, started_at, ended_at, status, escalated_to, satisfaction_rating, feedback) FROM stdin;
\.


--
-- Data for Name: chatbot_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chatbot_messages (message_id, conversation_id, sender_type, message_text, intent, confidence_score, response_time_ms, created_at) FROM stdin;
\.


--
-- Data for Name: collectors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.collectors (user_id, collector_type, created_at) FROM stdin;
71	home_collection	2025-09-07 19:27:35.493001
76	lab_visit	2025-09-09 20:37:30.54018
\.


--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_templates (template_id, template_name, event_trigger, subject_template, body_template, variables, is_active, created_at) FROM stdin;
1	Booking Confirmation	appointment_booked	Your booking is confirmed	Dear {{name}}, your booking is confirmed for {{date}}.	{"date": "", "name": ""}	t	2025-08-29 01:31:24.02469
2	Test Result Ready	test_result_ready	Your test result is ready	Dear {{name}}, your test result for {{test}} is ready.	{"name": "", "test": ""}	t	2025-08-29 01:31:24.02469
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, user_id, template_id, subject, message, status, priority, related_entity_type, related_entity_id, scheduled_at, sent_at, delivered_at, failure_reason, retry_count, created_at) FROM stdin;
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_methods (method_id, method_name, method_type, is_active) FROM stdin;
1	Cash	cash	t
2	Credit Card	card	t
3	UPI	upi	t
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (payment_id, payment_reference, appointment_id, user_id, payment_method_id, amount, currency, payment_status, gateway_response, transaction_id, completed_at, failure_reason, refund_amount, refund_reason, refunded_at) FROM stdin;
\.


--
-- Data for Name: samples; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.samples (sample_id, sample_code, appointment_test_id, collected_by, collected_at, collection_method, sample_quality, storage_location, temperature_maintained, received_by_lab, received_at, processing_started_at, processing_completed_at, status, rejection_reason, notes) FROM stdin;
29	SMP-1757932794238-634	49	71	2025-09-15 16:09:54.239144	\N	\N	\N	t	\N	\N	\N	\N	collected	\N	\N
30	SMP-1758016583485-374	51	76	2025-09-16 15:26:23.486609	\N	\N	\N	t	\N	\N	\N	\N	collected	\N	\N
31	SMP-1758016585171-309	52	76	2025-09-16 15:26:25.172616	\N	\N	\N	t	\N	\N	\N	\N	collected	\N	\N
32	SMP-1758017714624-909	53	76	2025-09-16 15:45:14.625623	\N	\N	\N	t	\N	\N	\N	\N	collected	\N	\N
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_settings (setting_id, setting_key, setting_value, setting_type, description, category, is_public, updated_by, updated_at) FROM stdin;
\.


--
-- Data for Name: test_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_categories (category_id, category_name, category_description, category_icon) FROM stdin;
40	Blood	Blood related tests	blood.png
41	Urine	Urine related tests	urine.png
42	Imaging	Imaging/Scan tests	imaging.png
\.


--
-- Data for Name: test_panels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_panels (panel_id, test_code, panel_json, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: test_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_reports (report_id, appointment_id, report_number, report_date, report_type, report_file_path, report_file_name, file_size_kb, generated_by, approved_by, patient_notified, patient_downloaded, download_count, first_downloaded_at, last_downloaded_at, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: test_results; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_results (result_id, sample_id, test_code, processed_by, verified_by, result_values, reference_ranges, abnormal_flags, interpretation, recommendations, critical_values, result_status, processed_at, verified_at, released_at, amended_reason, notes, appointment_test_id) FROM stdin;
17	29	IRON	74	74	{"tibc": "231", "ferritin": "20", "serum_iron": "50", "transferrin_saturation": "18"}	{"parameters": [{"key": "serum_iron", "unit": "µg/dL", "label": "Serum Iron", "notes": "Normal serum iron: 60–170 µg/dL; low suggests iron deficiency.", "range": {"low": 60, "high": 170}}, {"key": "tibc", "unit": "µg/dL", "label": "Total Iron Binding Capacity (TIBC)", "notes": "TIBC typically 240–450 µg/dL; high TIBC suggests iron deficiency.", "range": {"low": 240, "high": 450}}, {"key": "transferrin_saturation", "unit": "%", "label": "Transferrin Saturation", "notes": "Transferrin saturation 20–50% (low in iron deficiency).", "range": {"low": 20, "high": 50}}, {"key": "ferritin", "unit": "ng/mL", "label": "Serum Ferritin", "notes": "Ferritin reflects iron stores: Men 24–336 ng/mL, Women 11–307 ng/mL; low ferritin indicates iron deficiency.", "range": {"male": {"low": 24, "high": 336}, "female": {"low": 11, "high": 307}}}]}	{"tibc": {"key": "tibc", "flag": "low", "value": "231", "reason": "Below expected (240)"}, "ferritin": {"key": "ferritin", "flag": "low", "value": "20", "reason": "Below expected (24)"}, "serum_iron": {"key": "serum_iron", "flag": "low", "value": "50", "reason": "Below expected (60)"}, "transferrin_saturation": {"key": "transferrin_saturation", "flag": "low", "value": "18", "reason": "Below expected (20)"}}	The iron panel results for this 21-year-old male reveal a pattern consistent with iron deficiency. Serum iron (50 µg/dL, reference 60-170 µg/dL), transferrin saturation (18%, reference 20-50%), and serum ferritin (20 ng/mL, reference 24-336 ng/mL for males) are all below their respective reference ranges, indicating depleted iron stores and reduced iron availability. Total Iron Binding Capacity (TIBC) is borderline low at 231 µg/dL (reference 240-450 µg/dL). While low serum iron, low transferrin saturation, and low ferritin are classic indicators of iron deficiency, the low TIBC is atypical for isolated iron deficiency anemia, which usually presents with high TIBC. This atypical TIBC finding may suggest a concurrent inflammatory process or complex iron metabolism disorder. Clinical correlation for symptoms of anemia and potential etiologies of iron deficiency, particularly blood loss, is advised. ABC TEST	1. Obtain a Complete Blood Count (CBC) including red cell indices (MCV, MCH, RDW) to assess for anemia and characterize red cell morphology. 2. Investigate potential causes of iron deficiency, with particular attention to chronic blood loss (e.g., gastrointestinal, genitourinary sources) given the patient's age and gender. 3. Consider inflammatory markers (e.g., CRP, ESR) if anemia of chronic disease is a clinical concern due to the atypical TIBC finding. 4. Initiate appropriate iron supplementation based on clinical assessment and confirmed etiology. 5. Re-evaluate iron status parameters (serum iron, TIBC, transferrin saturation, ferritin) approximately 3 months after initiating treatment to monitor response. A ferritin level below 20 ng/mL is often considered a critical threshold indicating severe iron depletion and warrants prompt therapeutic intervention.	f	final	2025-09-15 16:12:26.873385	2025-09-15 16:12:26.873385	\N	\N	\N	49
\.


--
-- Data for Name: tests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tests (test_code, test_name, test_description, category_id, base_price, duration_hours, preparation_instructions, sample_type, fasting_required, fasting_hours, gender_specific, report_time_hours) FROM stdin;
CBC	Complete Blood Count (CBC)	A comprehensive blood test that evaluates your overall health and detects a variety of disorders.	40	350.00	1	No special prep	Blood	f	\N	\N	24
THYROID	Thyroid Profile (T3, T4, TSH)	Comprehensive thyroid function test including T3, T4, and TSH hormones.	40	600.00	2	No special prep	Blood	f	\N	\N	24
LFT	Liver Function Test (LFT)	Comprehensive liver function assessment including all major enzymes.	40	500.00	1	No alcohol 24h	Blood	f	\N	\N	24
KFT	Kidney Function Test (KFT)	Complete kidney function evaluation including creatinine and urea.	40	400.00	1	No special prep	Blood	f	\N	\N	24
URINE	Urine Routine Examination	Complete urine analysis for urinary tract infections and kidney health.	41	200.00	1	No special prep	Urine	f	\N	\N	24
IRON	Iron Deficiency Panel	Complete iron studies including ferritin, iron, and TIBC.	40	800.00	1	No special prep	Blood	f	\N	\N	24
VITD	Vitamin D Test	Measures vitamin D levels to assess bone health and immunity.	40	1200.00	2	No special prep	Blood	f	\N	\N	48
LIPID	Lipid Profile	Measures cholesterol and triglyceride levels to assess cardiovascular risk.	40	450.00	1	Fasting required	Blood	t	12	\N	24
HEALTHPKG	Complete Health Checkup	Comprehensive health package with 50+ parameters for overall health assessment.	\N	2500.00	2	Fasting required	Blood & Urine	t	12	\N	72
DIABPKG	Diabetes Package (HbA1c + Glucose)	Complete diabetes monitoring package with HbA1c and glucose levels.	\N	800.00	1	Fasting required	Blood	t	8	\N	24
\.


--
-- Data for Name: user_addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_addresses (address_id, user_id, address) FROM stdin;
\.


--
-- Data for Name: user_role_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_role_assignments (user_id, role_id) FROM stdin;
63	53
71	60
73	59
74	58
76	60
79	54
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (role_id, role_name, role_description) FROM stdin;
53	admin	Administrator
54	patient	Patient
58	lab_technician	Lab Technician
59	lab_manager	Lab Manager
60	sample_collector	Sample Collector
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, email, password_hash, first_name, last_name, phone, date_of_birth, gender, is_active, created_at, updated_at) FROM stdin;
63	admin@diagnosia.test	$2a$10$lwvKVn4IV/ZPhOt0O35L4.Wnps2UMau/gfkaCXuFmje1moV8emOqa	Admin	Diagnosia	+919900112233	1990-01-01	female	t	2025-09-06 01:50:42.769506	2025-09-06 01:50:42.769506
71	collector1@diagnosia.com	$2a$10$2kvrBqARYRfQswAjjC/Kzeyf9EnLDHKiXO.w2dHdDf7/il6UMvY3y	Abhay 	Verma	9876598765	2000-08-01	male	t	2025-09-07 19:27:35.491028	2025-09-07 19:27:35.491028
73	manager@diagnosia.com	$2a$10$6rCIPvk.eLXCCOz0dUYLve/j5S7woYkTgwiV/5q9gNhNYttI7gSy2	Nipun	Goel	9876543210	1991-11-30	male	t	2025-09-07 19:32:32.090104	2025-09-07 19:32:32.090104
74	technician1@diagnosia.com	$2a$10$uwSPqPTKEQYuMC4hHkTSReeEeHmIyVHzfgCyvwIAkcUEtQ7M/R8Wu	Shantanu	Dravid	9854761032	1995-12-05	male	t	2025-09-07 19:34:02.608361	2025-09-07 19:34:02.608361
76	collector2@diagnosia.com	$2a$10$vF75.CilNltdjhi6NekOlOiPDlbMOlNEpf48e4t9qVz2n..3dszeu	Nitesh	Rana	1234512345	2000-06-14	male	t	2025-09-09 20:37:30.538164	2025-09-09 20:37:30.538164
79	saxena.kkrishna@gmail.com	$2a$10$xb1aOrfJ51K8QC..0CqidOQ4nuoYGHBdZWptClgQH3SwJPY04mFaS	Kkrishna	Saxena	8588041210	2003-12-07	male	t	2025-09-15 16:07:35.090118	2025-09-15 16:07:35.090118
\.


--
-- Name: appointment_tests_appointment_test_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointment_tests_appointment_test_id_seq', 59, true);


--
-- Name: appointments_appointment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_appointment_id_seq', 59, true);


--
-- Name: audit_logs_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audit_logs_log_id_seq', 1, false);


--
-- Name: chatbot_conversations_conversation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chatbot_conversations_conversation_id_seq', 1, true);


--
-- Name: chatbot_messages_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chatbot_messages_message_id_seq', 2, true);


--
-- Name: notification_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notification_templates_template_id_seq', 2, true);


--
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_notification_id_seq', 1, true);


--
-- Name: payment_methods_method_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_methods_method_id_seq', 3, true);


--
-- Name: payments_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_payment_id_seq', 2, true);


--
-- Name: samples_sample_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.samples_sample_id_seq', 32, true);


--
-- Name: system_settings_setting_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_settings_setting_id_seq', 1, false);


--
-- Name: test_categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_categories_category_id_seq', 42, true);


--
-- Name: test_panels_panel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_panels_panel_id_seq', 1, false);


--
-- Name: test_reports_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_reports_report_id_seq', 1, false);


--
-- Name: test_results_result_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_results_result_id_seq', 17, true);


--
-- Name: user_addresses_address_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_addresses_address_id_seq', 28, true);


--
-- Name: user_roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_roles_role_id_seq', 60, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 79, true);


--
-- Name: appointment_tests appointment_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_tests
    ADD CONSTRAINT appointment_tests_pkey PRIMARY KEY (appointment_test_id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (appointment_id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (log_id);


--
-- Name: chatbot_conversations chatbot_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatbot_conversations
    ADD CONSTRAINT chatbot_conversations_pkey PRIMARY KEY (conversation_id);


--
-- Name: chatbot_messages chatbot_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatbot_messages
    ADD CONSTRAINT chatbot_messages_pkey PRIMARY KEY (message_id);


--
-- Name: collectors collectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collectors
    ADD CONSTRAINT collectors_pkey PRIMARY KEY (user_id);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (template_id);


--
-- Name: notification_templates notification_templates_template_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_template_name_key UNIQUE (template_name);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (method_id);


--
-- Name: payments payments_payment_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_reference_key UNIQUE (payment_reference);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- Name: samples samples_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_pkey PRIMARY KEY (sample_id);


--
-- Name: samples samples_sample_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_sample_code_key UNIQUE (sample_code);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (setting_id);


--
-- Name: system_settings system_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: test_categories test_categories_category_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_categories
    ADD CONSTRAINT test_categories_category_name_key UNIQUE (category_name);


--
-- Name: test_categories test_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_categories
    ADD CONSTRAINT test_categories_pkey PRIMARY KEY (category_id);


--
-- Name: test_panels test_panels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_panels
    ADD CONSTRAINT test_panels_pkey PRIMARY KEY (panel_id);


--
-- Name: test_panels test_panels_test_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_panels
    ADD CONSTRAINT test_panels_test_code_key UNIQUE (test_code);


--
-- Name: test_reports test_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_reports
    ADD CONSTRAINT test_reports_pkey PRIMARY KEY (report_id);


--
-- Name: test_reports test_reports_report_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_reports
    ADD CONSTRAINT test_reports_report_number_key UNIQUE (report_number);


--
-- Name: test_results test_results_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_pkey PRIMARY KEY (result_id);


--
-- Name: tests tests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_pkey PRIMARY KEY (test_code);


--
-- Name: test_categories unique_category_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_categories
    ADD CONSTRAINT unique_category_name UNIQUE (category_name);


--
-- Name: users unique_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT unique_email UNIQUE (email);


--
-- Name: payment_methods unique_method_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT unique_method_name UNIQUE (method_name);


--
-- Name: user_roles unique_role_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT unique_role_name UNIQUE (role_name);


--
-- Name: notification_templates unique_template_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT unique_template_name UNIQUE (template_name);


--
-- Name: tests unique_test_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT unique_test_code UNIQUE (test_code);


--
-- Name: user_addresses user_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_pkey PRIMARY KEY (address_id);


--
-- Name: user_role_assignments user_role_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (role_id);


--
-- Name: user_roles user_roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_name_key UNIQUE (role_name);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: idx_collectors_collector_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_collectors_collector_type ON public.collectors USING btree (collector_type);


--
-- Name: appointment_tests appointment_tests_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_tests
    ADD CONSTRAINT appointment_tests_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id);


--
-- Name: appointment_tests appointment_tests_test_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointment_tests
    ADD CONSTRAINT appointment_tests_test_code_fkey FOREIGN KEY (test_code) REFERENCES public.tests(test_code);


--
-- Name: appointments appointments_cancelled_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES public.users(user_id);


--
-- Name: appointments appointments_collection_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_collection_address_id_fkey FOREIGN KEY (collection_address_id) REFERENCES public.user_addresses(address_id);


--
-- Name: appointments appointments_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.users(user_id);


--
-- Name: appointments appointments_rescheduled_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_rescheduled_from_fkey FOREIGN KEY (rescheduled_from) REFERENCES public.appointments(appointment_id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: chatbot_conversations chatbot_conversations_escalated_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatbot_conversations
    ADD CONSTRAINT chatbot_conversations_escalated_to_fkey FOREIGN KEY (escalated_to) REFERENCES public.users(user_id);


--
-- Name: chatbot_conversations chatbot_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatbot_conversations
    ADD CONSTRAINT chatbot_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: chatbot_messages chatbot_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chatbot_messages
    ADD CONSTRAINT chatbot_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.chatbot_conversations(conversation_id);


--
-- Name: collectors collectors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.collectors
    ADD CONSTRAINT collectors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: notifications notifications_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.notification_templates(template_id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: payments payments_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id);


--
-- Name: payments payments_payment_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES public.payment_methods(method_id);


--
-- Name: payments payments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: samples samples_appointment_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_appointment_test_id_fkey FOREIGN KEY (appointment_test_id) REFERENCES public.appointment_tests(appointment_test_id);


--
-- Name: samples samples_collected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_collected_by_fkey FOREIGN KEY (collected_by) REFERENCES public.users(user_id);


--
-- Name: samples samples_received_by_lab_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.samples
    ADD CONSTRAINT samples_received_by_lab_fkey FOREIGN KEY (received_by_lab) REFERENCES public.users(user_id);


--
-- Name: system_settings system_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(user_id);


--
-- Name: test_reports test_reports_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_reports
    ADD CONSTRAINT test_reports_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(appointment_id);


--
-- Name: test_reports test_reports_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_reports
    ADD CONSTRAINT test_reports_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(user_id);


--
-- Name: test_reports test_reports_generated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_reports
    ADD CONSTRAINT test_reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users(user_id);


--
-- Name: test_results test_results_appointment_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_appointment_test_id_fkey FOREIGN KEY (appointment_test_id) REFERENCES public.appointment_tests(appointment_test_id);


--
-- Name: test_results test_results_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(user_id);


--
-- Name: test_results test_results_sample_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(sample_id);


--
-- Name: test_results test_results_test_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_test_code_fkey FOREIGN KEY (test_code) REFERENCES public.tests(test_code);


--
-- Name: test_results test_results_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.test_results
    ADD CONSTRAINT test_results_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(user_id);


--
-- Name: tests tests_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tests
    ADD CONSTRAINT tests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.test_categories(category_id);


--
-- Name: user_addresses user_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_addresses
    ADD CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: user_role_assignments user_role_assignments_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.user_roles(role_id);


--
-- Name: user_role_assignments user_role_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_role_assignments
    ADD CONSTRAINT user_role_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict PQuZYLml4CwR8y2hBrqRF6CoyMlfVwBY9ECu53SwmPheRgigXi7xZuv6O0Yi2KN

