--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4 (Ubuntu 17.4-1.pgdg22.04+2)
-- Dumped by pg_dump version 17.4 (Ubuntu 17.4-1.pgdg22.04+2)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: attendancestatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.attendancestatus AS ENUM (
    'PRESENT',
    'ABSENT',
    'LATE',
    'ON_LEAVE'
);


ALTER TYPE public.attendancestatus OWNER TO postgres;

--
-- Name: clientstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.clientstatus AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PENDING'
);


ALTER TYPE public.clientstatus OWNER TO postgres;

--
-- Name: documenttype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.documenttype AS ENUM (
    'RESUME',
    'CONTRACT',
    'ID_PROOF',
    'CERTIFICATE',
    'OTHER'
);


ALTER TYPE public.documenttype OWNER TO postgres;

--
-- Name: expensecategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.expensecategory AS ENUM (
    'AD_PLACEMENT',
    'CONTENT_CREATION',
    'INFLUENCER',
    'ANALYTICS',
    'OTHER'
);


ALTER TYPE public.expensecategory OWNER TO postgres;

--
-- Name: leadstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.leadstatus AS ENUM (
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'PROPOSAL',
    'NEGOTIATION',
    'WON',
    'LOST'
);


ALTER TYPE public.leadstatus OWNER TO postgres;

--
-- Name: leavestatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.leavestatus AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public.leavestatus OWNER TO postgres;

--
-- Name: leavetype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.leavetype AS ENUM (
    'CASUAL',
    'SICK',
    'ANNUAL',
    'UNPAID',
    'OTHER'
);


ALTER TYPE public.leavetype OWNER TO postgres;

--
-- Name: milestonestatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.milestonestatus AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.milestonestatus OWNER TO postgres;

--
-- Name: taskpriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.taskpriority AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public.taskpriority OWNER TO postgres;

--
-- Name: taskstatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.taskstatus AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public.taskstatus OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    date date NOT NULL,
    status public.attendancestatus NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgets (
    id integer NOT NULL,
    total_budget numeric(10,2) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.budgets OWNER TO postgres;

--
-- Name: budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budgets_id_seq OWNER TO postgres;

--
-- Name: budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budgets_id_seq OWNED BY public.budgets.id;


--
-- Name: campaign_expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.campaign_expenses (
    id integer NOT NULL,
    campaign_id integer,
    description character varying NOT NULL,
    amount double precision NOT NULL,
    category public.expensecategory,
    date date NOT NULL,
    created_at timestamp without time zone
);


ALTER TABLE public.campaign_expenses OWNER TO postgres;

--
-- Name: campaign_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.campaign_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.campaign_expenses_id_seq OWNER TO postgres;

--
-- Name: campaign_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.campaign_expenses_id_seq OWNED BY public.campaign_expenses.id;


--
-- Name: candidates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.candidates (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    "position" character varying NOT NULL,
    experience integer,
    skills character varying,
    resume_url character varying,
    stage character varying NOT NULL,
    status character varying NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.candidates OWNER TO postgres;

--
-- Name: candidates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.candidates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.candidates_id_seq OWNER TO postgres;

--
-- Name: candidates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.candidates_id_seq OWNED BY public.candidates.id;


--
-- Name: client_feedbacks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_feedbacks (
    id integer NOT NULL,
    client_email character varying NOT NULL,
    feedback text,
    rating integer,
    remarks text,
    form_token character varying,
    form_expires_at timestamp without time zone,
    is_submitted boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.client_feedbacks OWNER TO postgres;

--
-- Name: client_feedbacks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_feedbacks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_feedbacks_id_seq OWNER TO postgres;

--
-- Name: client_feedbacks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_feedbacks_id_seq OWNED BY public.client_feedbacks.id;


--
-- Name: client_service_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_service_documents (
    id integer NOT NULL,
    service_id integer NOT NULL,
    name character varying NOT NULL,
    file_url character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.client_service_documents OWNER TO postgres;

--
-- Name: client_service_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_service_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_service_documents_id_seq OWNER TO postgres;

--
-- Name: client_service_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_service_documents_id_seq OWNED BY public.client_service_documents.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    address text,
    status public.clientstatus NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    assigned_to integer
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: department_budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.department_budgets (
    id integer NOT NULL,
    budget_id integer NOT NULL,
    department character varying NOT NULL,
    allocated_amount numeric(10,2) NOT NULL,
    spent_amount numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.department_budgets OWNER TO postgres;

--
-- Name: department_budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.department_budgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.department_budgets_id_seq OWNER TO postgres;

--
-- Name: department_budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.department_budgets_id_seq OWNED BY public.department_budgets.id;


--
-- Name: document_folders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_folders (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying,
    is_confidential boolean,
    access_key character varying(100),
    created_at timestamp without time zone,
    created_by integer
);


ALTER TABLE public.document_folders OWNER TO postgres;

--
-- Name: document_folders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_folders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_folders_id_seq OWNER TO postgres;

--
-- Name: document_folders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_folders_id_seq OWNED BY public.document_folders.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    file_path character varying NOT NULL,
    file_type public.documenttype NOT NULL,
    folder_id integer,
    employee_id integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    uploaded_by integer
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: employee_feedbacks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_feedbacks (
    id integer NOT NULL,
    from_employee_id integer NOT NULL,
    to_employee_id integer NOT NULL,
    feedback text NOT NULL,
    rating integer NOT NULL,
    remarks text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.employee_feedbacks OWNER TO postgres;

--
-- Name: employee_feedbacks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employee_feedbacks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employee_feedbacks_id_seq OWNER TO postgres;

--
-- Name: employee_feedbacks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employee_feedbacks_id_seq OWNED BY public.employee_feedbacks.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    "position" character varying NOT NULL,
    department character varying NOT NULL,
    salary numeric(10,2),
    hire_date date NOT NULL,
    status character varying NOT NULL,
    address character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    type character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    department character varying NOT NULL,
    date date NOT NULL,
    description character varying,
    receipt_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.expenses OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.expenses_id_seq OWNER TO postgres;

--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: general_expenses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.general_expenses (
    id integer NOT NULL,
    title character varying NOT NULL,
    amount double precision NOT NULL,
    date date NOT NULL,
    description character varying,
    category character varying NOT NULL,
    payment_method character varying NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.general_expenses OWNER TO postgres;

--
-- Name: general_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.general_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.general_expenses_id_seq OWNER TO postgres;

--
-- Name: general_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.general_expenses_id_seq OWNED BY public.general_expenses.id;


--
-- Name: interactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interactions (
    id integer NOT NULL,
    service_id integer NOT NULL,
    details text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.interactions OWNER TO postgres;

--
-- Name: interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interactions_id_seq OWNER TO postgres;

--
-- Name: interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interactions_id_seq OWNED BY public.interactions.id;


--
-- Name: leads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    name character varying NOT NULL,
    company character varying,
    email character varying NOT NULL,
    phone character varying,
    source character varying,
    status public.leadstatus NOT NULL,
    notes text,
    expected_value double precision,
    assigned_to integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    client_id integer
);


ALTER TABLE public.leads OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leads_id_seq OWNER TO postgres;

--
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_balances (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    year integer NOT NULL,
    casual_leave integer,
    sick_leave integer,
    annual_leave integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.leave_balances OWNER TO postgres;

--
-- Name: leave_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_balances_id_seq OWNER TO postgres;

--
-- Name: leave_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_balances_id_seq OWNED BY public.leave_balances.id;


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    leave_type public.leavetype NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text NOT NULL,
    status public.leavestatus,
    approved_by integer,
    rejection_reason text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_requests_id_seq OWNER TO postgres;

--
-- Name: leave_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_requests_id_seq OWNED BY public.leave_requests.id;


--
-- Name: milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.milestones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.milestones_id_seq OWNER TO postgres;

--
-- Name: milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.milestones (
    id integer DEFAULT nextval('public.milestones_id_seq'::regclass) NOT NULL,
    title character varying,
    description character varying,
    date date,
    type character varying,
    achieved_date date,
    employee_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.milestones OWNER TO postgres;

--
-- Name: recruitment_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruitment_stats (
    id integer NOT NULL,
    total_candidates integer,
    active_candidates integer,
    hired_candidates integer,
    applied_candidates integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.recruitment_stats OWNER TO postgres;

--
-- Name: recruitment_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recruitment_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recruitment_stats_id_seq OWNER TO postgres;

--
-- Name: recruitment_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recruitment_stats_id_seq OWNED BY public.recruitment_stats.id;


--
-- Name: scheduled_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scheduled_posts (
    id integer NOT NULL,
    campaign_id integer,
    content text NOT NULL,
    platforms character varying NOT NULL,
    scheduled_time timestamp without time zone NOT NULL,
    image_url character varying,
    link_url character varying,
    target_audience json,
    status character varying NOT NULL,
    performance_metrics json NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.scheduled_posts OWNER TO postgres;

--
-- Name: scheduled_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scheduled_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scheduled_posts_id_seq OWNER TO postgres;

--
-- Name: scheduled_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scheduled_posts_id_seq OWNED BY public.scheduled_posts.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id integer NOT NULL,
    client_id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    stage character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO postgres;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: social_media_campaigns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_media_campaigns (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    platforms character varying NOT NULL,
    budget double precision NOT NULL,
    spent double precision NOT NULL,
    roi double precision NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.social_media_campaigns OWNER TO postgres;

--
-- Name: social_media_campaigns_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.social_media_campaigns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.social_media_campaigns_id_seq OWNER TO postgres;

--
-- Name: social_media_campaigns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.social_media_campaigns_id_seq OWNED BY public.social_media_campaigns.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    assigned_to integer NOT NULL,
    assigned_by integer NOT NULL,
    due_date date NOT NULL,
    priority public.taskpriority NOT NULL,
    status public.taskstatus NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    tags character varying[],
    comments text
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tasks_id_seq OWNER TO postgres;

--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    hashed_password character varying NOT NULL,
    role character varying NOT NULL,
    is_active boolean,
    is_verified boolean,
    verification_token character varying,
    verification_token_expires timestamp without time zone,
    created_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- Name: budgets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets ALTER COLUMN id SET DEFAULT nextval('public.budgets_id_seq'::regclass);


--
-- Name: campaign_expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_expenses ALTER COLUMN id SET DEFAULT nextval('public.campaign_expenses_id_seq'::regclass);


--
-- Name: candidates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates ALTER COLUMN id SET DEFAULT nextval('public.candidates_id_seq'::regclass);


--
-- Name: client_feedbacks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_feedbacks ALTER COLUMN id SET DEFAULT nextval('public.client_feedbacks_id_seq'::regclass);


--
-- Name: client_service_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_service_documents ALTER COLUMN id SET DEFAULT nextval('public.client_service_documents_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: department_budgets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_budgets ALTER COLUMN id SET DEFAULT nextval('public.department_budgets_id_seq'::regclass);


--
-- Name: document_folders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_folders ALTER COLUMN id SET DEFAULT nextval('public.document_folders_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: employee_feedbacks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_feedbacks ALTER COLUMN id SET DEFAULT nextval('public.employee_feedbacks_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: general_expenses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.general_expenses ALTER COLUMN id SET DEFAULT nextval('public.general_expenses_id_seq'::regclass);


--
-- Name: interactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactions ALTER COLUMN id SET DEFAULT nextval('public.interactions_id_seq'::regclass);


--
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- Name: leave_balances id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances ALTER COLUMN id SET DEFAULT nextval('public.leave_balances_id_seq'::regclass);


--
-- Name: leave_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests ALTER COLUMN id SET DEFAULT nextval('public.leave_requests_id_seq'::regclass);


--
-- Name: recruitment_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_stats ALTER COLUMN id SET DEFAULT nextval('public.recruitment_stats_id_seq'::regclass);


--
-- Name: scheduled_posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_posts ALTER COLUMN id SET DEFAULT nextval('public.scheduled_posts_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: social_media_campaigns id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_media_campaigns ALTER COLUMN id SET DEFAULT nextval('public.social_media_campaigns_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
update_employee_feedback_fk
add_milestone_fields_safe
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, employee_id, date, status, created_at, updated_at) FROM stdin;
1	3	2025-04-26	PRESENT	2025-04-26 18:25:47.915066	\N
2	3	2025-04-25	PRESENT	2025-04-26 18:55:15.354997	\N
3	5	2025-04-26	PRESENT	2025-04-26 19:20:20.502114	\N
4	3	2025-05-01	PRESENT	2025-05-01 14:17:30.118216	\N
5	3	2025-05-23	PRESENT	2025-05-02 16:12:44.588368	\N
6	3	2025-05-22	ABSENT	2025-05-04 10:02:46.970597	\N
7	5	2025-05-06	PRESENT	2025-05-06 21:55:14.403345	\N
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budgets (id, total_budget, start_date, end_date, status, created_at, updated_at) FROM stdin;
1	1000.00	2025-04-26	2025-05-11	active	2025-04-26 15:20:54.801886	2025-04-26 15:20:54.801886
\.


--
-- Data for Name: campaign_expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.campaign_expenses (id, campaign_id, description, amount, category, date, created_at) FROM stdin;
\.


--
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.candidates (id, name, email, phone, "position", experience, skills, resume_url, stage, status, notes, created_at, updated_at) FROM stdin;
2	Akshna	akhilamarchela0987@gmail.com	09030848641	Employee	5	Machine Learning,python	\N	screening	active	.......	2025-05-03 08:29:27.024311	2025-05-03 13:13:46.063577
3	John Doe	john.doe@example.com	1234567890	Software Engineer	5	Python, FastAPI, React	\N	applied	active	Sample candidate notes	2025-05-04 10:03:23.433029	2025-05-04 10:03:23.433029
1	John Doe	satyamacherla078@gmail.com	1234567890	Software Engineer	5	Python,FastAPI,React	uploads/resumes/1_20250424_162659.pdf	screening	active	Sample candidate notes	2025-04-24 16:26:31.237866	2025-05-06 22:01:26.171233
\.


--
-- Data for Name: client_feedbacks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_feedbacks (id, client_email, feedback, rating, remarks, form_token, form_expires_at, is_submitted, created_at, updated_at) FROM stdin;
2	akhilamarchela0987@gmail.com	Good work, THe serivce met out expectations..	4	.	DHm6FVBvoC5bEDuTCQRoXOUuX0jfucL-wxZa7Hkbomg	2025-05-07 04:33:11.950512	t	2025-04-30 04:33:11.954604	2025-04-30 04:34:19.902601
\.


--
-- Data for Name: client_service_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_service_documents (id, service_id, name, file_url, created_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, name, email, phone, address, status, notes, created_at, updated_at, assigned_to) FROM stdin;
6	Akshna	akhila@gmail.com	09030848641	RAM NAGAR, musheerabad	ACTIVE	.........	2025-05-02 15:43:01.499832	2025-05-02 18:28:46.153054	5
\.


--
-- Data for Name: department_budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department_budgets (id, budget_id, department, allocated_amount, spent_amount, created_at, updated_at) FROM stdin;
12	1	HR	400.00	0.00	2025-05-06 22:04:17.681778	2025-05-06 22:04:17.681778
13	1	Design	100.00	0.00	2025-05-06 22:04:17.701365	2025-05-06 22:04:17.701365
15	1	hr	100.00	0.00	2025-05-06 22:04:17.711467	2025-05-06 22:04:17.711467
14	1	Marketing	100.00	100.00	2025-05-06 22:04:17.707476	2025-05-06 22:04:17.729219
\.


--
-- Data for Name: document_folders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_folders (id, name, description, is_confidential, access_key, created_at, created_by) FROM stdin;
1	hr	\N	f	\N	2025-04-26 16:31:26.809863	1
4	Admin	\N	t	\N	2025-05-03 05:22:04.212607	1
6	Employees	\N	f	\N	2025-05-03 06:17:39.680993	1
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, title, description, file_path, file_type, folder_id, employee_id, created_at, updated_at, uploaded_by) FROM stdin;
14	nnn	mmmmm	uploads/documents/4/20250503_113621_90ec3d4b02ff83403573c61a288bc202.pdf	OTHER	4	\N	\N	\N	1
15	Resume	mmmm	uploads/documents/1/20250503_114143_7a22b10738c57192de2984d49fc6a054.png	OTHER	1	\N	\N	\N	2
16	EmployeeResume	....	uploads/documents/1/20250503_114616_90ec3d4b02ff83403573c61a288bc202.pdf	OTHER	1	\N	\N	\N	1
17	Employee	......	uploads/documents/6/20250503_114806_36d5b262ad18d1c9cf8e52ddc25caf04.xlsx	OTHER	6	\N	\N	\N	1
18	NSC_IITDelhi_Akhila.pdf	,	uploads/documents/NSC_IITDelhi_Akhilapdf_20250503_131528.pdf	ID_PROOF	\N	3	\N	\N	\N
20	mm	mmm	uploads/documents/1/20250503_131703_ad1ea7e3ccf9aa78d83050922df58a04.pdf	OTHER	1	\N	\N	\N	1
21	task-report-2025-05.pdf	Campaign	uploads/documents/task-report-2025-05pdf_20250503_131739.pdf	OTHER	\N	3	\N	\N	\N
24	CCLE_Activities_By_Term_Sanitized.pdf	poster making	uploads/documents/CCLE_Activities_By_Term_Sanitizedpdf_20250508_064801.pdf	ID_PROOF	\N	6	\N	\N	\N
\.


--
-- Data for Name: employee_feedbacks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_feedbacks (id, from_employee_id, to_employee_id, feedback, rating, remarks, created_at, updated_at) FROM stdin;
22	1	5	Great work, Keep it up..	5	.........	2025-04-30 04:58:30.586122	2025-04-30 04:58:30.58613
23	2	6	Good work	4	.......	2025-04-30 05:16:43.372806	2025-04-30 05:16:43.372815
24	1	3	k	4	...	2025-05-06 16:37:03.660919	2025-05-06 16:37:03.660927
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, name, email, phone, "position", department, salary, hire_date, status, address, created_at, updated_at) FROM stdin;
6	satya	satyamacherla078@gmail.com	7894563210	Employee	Engineering	100.00	2025-04-26	active	\N	2025-04-26 20:28:33.559581	2025-04-26 20:28:33.559581
3	Macherla Akhila	akhilamarchela0987@gmail.com	+919030848641	Employee	IT	10000.00	2025-04-26	active		2025-04-26 15:22:47.442347	2025-05-04 10:01:22.873066
5	John Doe	john.doe@example.com	+1234567890	Frontend Developer	Engineering	7500.00	2023-01-15	active		2025-04-26 19:20:00.078892	2025-05-06 21:54:15.849665
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, type, amount, department, date, description, receipt_url, created_at, updated_at) FROM stdin;
1	Marketing	100.00	Marketing	2025-04-26	poster making	/uploads/receipts/b4f46138-568b-4bc7-a96a-8e04396529db.pdf	2025-04-26 15:21:40.568369	2025-04-26 15:21:40.568369
\.


--
-- Data for Name: general_expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.general_expenses (id, title, amount, date, description, category, payment_method, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: interactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interactions (id, service_id, details, created_at) FROM stdin;
11	6	Last meeting was held on 12-2-2025. Discussed about the Proposal.	2025-05-08 11:09:02.990841
12	6	Had a meeting with updating the Requirements. 	2025-05-08 11:43:47.760337
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, name, company, email, phone, source, status, notes, expected_value, assigned_to, created_at, updated_at, client_id) FROM stdin;
51	John Doe	Example Corp	john@example.com	1234567890	Friends	WON	Interested in our services	10000	3	2025-05-01 21:24:47.47993	2025-05-04 09:51:58.951047	\N
54	John Doe	Example Corp	john@example.com	1234567890	Website	PROPOSAL	Interested in our services	10000	\N	2025-05-04 10:12:48.544194	2025-05-04 10:12:54.201352	\N
45	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	Website	NEGOTIATION	....	1000	5	2025-05-01 14:46:10.190199	2025-05-06 22:10:00.391044	\N
\.


--
-- Data for Name: leave_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_balances (id, employee_id, year, casual_leave, sick_leave, annual_leave, created_at, updated_at) FROM stdin;
1	1	2025	12	15	19	2025-04-26 09:52:57.45257	2025-04-26 09:53:08.365822
2	2	2025	12	15	18	2025-04-30 05:15:54.521581	2025-04-30 05:18:16.791241
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_requests (id, employee_id, leave_type, start_date, end_date, reason, status, approved_by, rejection_reason, created_at, updated_at) FROM stdin;
2	2	ANNUAL	2025-04-30	2025-05-01	outing	APPROVED	1	\N	2025-04-30 05:17:43.559074	2025-04-30 05:18:16.788335
3	1	ANNUAL	2025-05-09	2025-05-24	Annual leave	REJECTED	\N	Request rejected by admin	2025-05-03 04:45:21.348746	2025-05-04 04:42:21.012104
4	1	CASUAL	2025-05-07	2025-05-07	mm	PENDING	\N	\N	2025-05-06 17:18:32.208183	2025-05-06 17:18:32.208187
5	2	CASUAL	2025-05-06	2025-05-08	mmmmmmm	PENDING	\N	\N	2025-05-06 17:19:28.118691	2025-05-06 17:19:28.118695
\.


--
-- Data for Name: milestones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.milestones (id, title, description, date, type, achieved_date, employee_id, created_at) FROM stdin;
5	Promotion to HR	..................	\N	general	2025-05-08	6	2025-05-08 07:13:39.245026
6	Milestone	........	\N	general	2025-05-08	6	2025-05-08 07:22:00.255
7	Promotion to HR	.............	\N	general	2025-05-09	3	2025-05-09 10:46:08.619027
8	Completion of Project	..............	\N	general	2025-05-09	3	2025-05-09 10:54:55.289833
\.


--
-- Data for Name: recruitment_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recruitment_stats (id, total_candidates, active_candidates, hired_candidates, applied_candidates, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: scheduled_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scheduled_posts (id, campaign_id, content, platforms, scheduled_time, image_url, link_url, target_audience, status, performance_metrics, created_at, updated_at) FROM stdin;
1	1	..................	instagram,twitter	2025-04-27 04:20:00	http://localhost:8080/social	http://localhost:8080/social	{}	SCHEDULED	{}	2025-04-26 09:50:09.808362	2025-05-01 14:46:54.960515
2	1	................	instagram,twitter	2025-05-05 10:06:00	http://localhost:8080/social	http://localhost:8080/social	{}	SCHEDULED	{}	2025-05-04 04:36:52.877108	2025-05-04 04:36:52.877111
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, client_id, name, description, stage, created_at) FROM stdin;
6	6	Marketing	Targeting on new audience	Active	2025-05-08 11:04:29.815845
\.


--
-- Data for Name: social_media_campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_media_campaigns (id, name, description, platforms, budget, spent, roi, start_date, end_date, status, created_at, updated_at) FROM stdin;
1	Summer offer	poster making	instagram	100	0	0	2025-04-27	2025-05-09	PLANNED	2025-04-26 09:49:53.455064	2025-04-26 09:49:53.455072
2	Summer offer	....	instagram	100	0	0	2025-05-03	2025-06-01	ACTIVE	2025-05-04 04:36:21.798343	2025-05-04 04:36:21.798348
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, assigned_to, assigned_by, due_date, priority, status, created_at, updated_at, completed_at, tags, comments) FROM stdin;
9	n	poster making	6	1	2025-04-30	MEDIUM	PENDING	2025-04-30 15:22:07.009153	2025-04-30 15:22:07.009153	\N	{}	
8	m	n	3	1	2025-04-30	LOW	PENDING	2025-04-30 14:23:41.79043	2025-05-02 16:12:39.122511	\N	{}	
10	App dev	......	5	1	2025-05-03	HIGH	PENDING	2025-05-03 02:48:41.92941	2025-05-03 02:48:41.92941	\N	{}	
11	App	Campaign	5	1	2025-05-06	HIGH	PENDING	2025-05-06 21:54:41.23077	2025-05-06 21:54:41.23077	\N	{}	\N
4	b	poster making	6	1	2025-04-26	HIGH	COMPLETED	2025-04-26 15:47:39.213779	2025-05-08 06:47:36.774154	2025-04-30 13:12:41.317645	{}	
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, hashed_password, role, is_active, is_verified, verification_token, verification_token_expires, created_at) FROM stdin;
1	Admin	equitywalaa@gmail.com	$2b$12$DuKewDK4AjvIokfKcXin2OfZiZRBomktaJGCncDj1svGI2wOqZ7Z.	admin	t	t	\N	\N	2025-04-24 10:55:49.97138
2	Macherla Akhila	akhilamarchela0987@gmail.com	$2b$12$9zcb9w98dZFDxhMRRuIvx.YV25IbeU5iqBm0sSnaAWWbpJm/39ZYa	employee	t	t	\N	\N	2025-04-30 05:15:11.839504
\.


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 7, true);


--
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budgets_id_seq', 1, true);


--
-- Name: campaign_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.campaign_expenses_id_seq', 1, false);


--
-- Name: candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.candidates_id_seq', 3, true);


--
-- Name: client_feedbacks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_feedbacks_id_seq', 2, true);


--
-- Name: client_service_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_service_documents_id_seq', 3, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 9, true);


--
-- Name: department_budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.department_budgets_id_seq', 15, true);


--
-- Name: document_folders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_folders_id_seq', 6, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 24, true);


--
-- Name: employee_feedbacks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_feedbacks_id_seq', 24, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 6, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 1, true);


--
-- Name: general_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.general_expenses_id_seq', 1, false);


--
-- Name: interactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interactions_id_seq', 12, true);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leads_id_seq', 54, true);


--
-- Name: leave_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_balances_id_seq', 2, true);


--
-- Name: leave_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_requests_id_seq', 5, true);


--
-- Name: milestones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.milestones_id_seq', 8, true);


--
-- Name: recruitment_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recruitment_stats_id_seq', 1, false);


--
-- Name: scheduled_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scheduled_posts_id_seq', 2, true);


--
-- Name: services_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.services_id_seq', 6, true);


--
-- Name: social_media_campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.social_media_campaigns_id_seq', 2, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 11, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- Name: campaign_expenses campaign_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_expenses
    ADD CONSTRAINT campaign_expenses_pkey PRIMARY KEY (id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: client_feedbacks client_feedbacks_form_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_feedbacks
    ADD CONSTRAINT client_feedbacks_form_token_key UNIQUE (form_token);


--
-- Name: client_feedbacks client_feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_feedbacks
    ADD CONSTRAINT client_feedbacks_pkey PRIMARY KEY (id);


--
-- Name: client_service_documents client_service_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_service_documents
    ADD CONSTRAINT client_service_documents_pkey PRIMARY KEY (id);


--
-- Name: clients clients_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_email_key UNIQUE (email);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: department_budgets department_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_budgets
    ADD CONSTRAINT department_budgets_pkey PRIMARY KEY (id);


--
-- Name: document_folders document_folders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_folders
    ADD CONSTRAINT document_folders_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: employee_feedbacks employee_feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_feedbacks
    ADD CONSTRAINT employee_feedbacks_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: general_expenses general_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.general_expenses
    ADD CONSTRAINT general_expenses_pkey PRIMARY KEY (id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: milestones milestones_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_new_pkey PRIMARY KEY (id);


--
-- Name: recruitment_stats recruitment_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_stats
    ADD CONSTRAINT recruitment_stats_pkey PRIMARY KEY (id);


--
-- Name: scheduled_posts scheduled_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_posts
    ADD CONSTRAINT scheduled_posts_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: social_media_campaigns social_media_campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_media_campaigns
    ADD CONSTRAINT social_media_campaigns_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: attendance unique_employee_attendance_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT unique_employee_attendance_date UNIQUE (employee_id, date);


--
-- Name: leave_balances unique_employee_year; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT unique_employee_year UNIQUE (employee_id, year);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_attendance_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_attendance_id ON public.attendance USING btree (id);


--
-- Name: ix_budgets_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_budgets_id ON public.budgets USING btree (id);


--
-- Name: ix_campaign_expenses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_campaign_expenses_id ON public.campaign_expenses USING btree (id);


--
-- Name: ix_candidates_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_candidates_id ON public.candidates USING btree (id);


--
-- Name: ix_client_feedbacks_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_client_feedbacks_id ON public.client_feedbacks USING btree (id);


--
-- Name: ix_client_service_documents_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_client_service_documents_id ON public.client_service_documents USING btree (id);


--
-- Name: ix_clients_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_clients_id ON public.clients USING btree (id);


--
-- Name: ix_department_budgets_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_department_budgets_id ON public.department_budgets USING btree (id);


--
-- Name: ix_document_folders_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_document_folders_id ON public.document_folders USING btree (id);


--
-- Name: ix_documents_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_documents_id ON public.documents USING btree (id);


--
-- Name: ix_employee_feedbacks_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_employee_feedbacks_id ON public.employee_feedbacks USING btree (id);


--
-- Name: ix_employees_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_employees_email ON public.employees USING btree (email);


--
-- Name: ix_employees_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_employees_id ON public.employees USING btree (id);


--
-- Name: ix_expenses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_expenses_id ON public.expenses USING btree (id);


--
-- Name: ix_general_expenses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_general_expenses_id ON public.general_expenses USING btree (id);


--
-- Name: ix_interactions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_interactions_id ON public.interactions USING btree (id);


--
-- Name: ix_leads_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_leads_id ON public.leads USING btree (id);


--
-- Name: ix_leave_balances_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_leave_balances_id ON public.leave_balances USING btree (id);


--
-- Name: ix_leave_requests_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_leave_requests_id ON public.leave_requests USING btree (id);


--
-- Name: ix_milestones_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_milestones_id ON public.milestones USING btree (id);


--
-- Name: ix_recruitment_stats_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_recruitment_stats_id ON public.recruitment_stats USING btree (id);


--
-- Name: ix_scheduled_posts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_scheduled_posts_id ON public.scheduled_posts USING btree (id);


--
-- Name: ix_services_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_services_id ON public.services USING btree (id);


--
-- Name: ix_social_media_campaigns_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_social_media_campaigns_id ON public.social_media_campaigns USING btree (id);


--
-- Name: ix_tasks_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_tasks_id ON public.tasks USING btree (id);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: attendance attendance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: campaign_expenses campaign_expenses_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.campaign_expenses
    ADD CONSTRAINT campaign_expenses_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.social_media_campaigns(id) ON DELETE CASCADE;


--
-- Name: client_service_documents client_service_documents_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_service_documents
    ADD CONSTRAINT client_service_documents_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: department_budgets department_budgets_budget_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.department_budgets
    ADD CONSTRAINT department_budgets_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id);


--
-- Name: document_folders document_folders_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_folders
    ADD CONSTRAINT document_folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: documents documents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: documents documents_folder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.document_folders(id);


--
-- Name: documents documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: employee_feedbacks employee_feedbacks_from_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_feedbacks
    ADD CONSTRAINT employee_feedbacks_from_employee_id_fkey FOREIGN KEY (from_employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: employee_feedbacks employee_feedbacks_to_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_feedbacks
    ADD CONSTRAINT employee_feedbacks_to_employee_id_fkey FOREIGN KEY (to_employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: clients fk_clients_assigned_to_employees; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT fk_clients_assigned_to_employees FOREIGN KEY (assigned_to) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: interactions interactions_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: leads leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: leads leads_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: leave_balances leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: leave_requests leave_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: leave_requests leave_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: milestones milestones_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: scheduled_posts scheduled_posts_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_posts
    ADD CONSTRAINT scheduled_posts_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.social_media_campaigns(id) ON DELETE SET NULL;


--
-- Name: services services_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: tasks tasks_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: tasks tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

