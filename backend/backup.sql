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
    'LEAVE'
);


ALTER TYPE public.attendancestatus OWNER TO postgres;

--
-- Name: componenttype; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.componenttype AS ENUM (
    'EARNING',
    'DEDUCTION'
);


ALTER TYPE public.componenttype OWNER TO postgres;

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

--
-- Name: column_exists(text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.column_exists(tbl text, col text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = tbl AND column_name = col
    );
END;
$$;


ALTER FUNCTION public.column_exists(tbl text, col text) OWNER TO postgres;

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
    status character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
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
    employee_id integer NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    url character varying NOT NULL,
    upload_date timestamp without time zone DEFAULT now(),
    uploader_id integer,
    folder_id integer
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT employee_feedbacks_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
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
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    address character varying
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
    updated_at timestamp without time zone DEFAULT now()
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
-- Name: milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.milestones (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    achieved_date date NOT NULL,
    type character varying NOT NULL
);


ALTER TABLE public.milestones OWNER TO postgres;

--
-- Name: milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.milestones_id_seq OWNER TO postgres;

--
-- Name: milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.milestones_id_seq OWNED BY public.milestones.id;


--
-- Name: payslips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payslips (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    base_salary numeric(10,2) NOT NULL,
    total_earnings numeric(10,2) NOT NULL,
    total_deductions numeric(10,2) NOT NULL,
    net_salary numeric(10,2) NOT NULL,
    components json NOT NULL,
    status character varying,
    generated_at timestamp without time zone,
    sent_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.payslips OWNER TO postgres;

--
-- Name: payslips_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payslips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payslips_id_seq OWNER TO postgres;

--
-- Name: payslips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payslips_id_seq OWNED BY public.payslips.id;


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
-- Name: salary_components; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_components (
    id integer NOT NULL,
    name character varying NOT NULL,
    type public.componenttype NOT NULL,
    amount numeric(10,2) NOT NULL,
    is_percentage boolean,
    description text,
    employee_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.salary_components OWNER TO postgres;

--
-- Name: salary_components_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.salary_components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.salary_components_id_seq OWNER TO postgres;

--
-- Name: salary_components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.salary_components_id_seq OWNED BY public.salary_components.id;


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
    due_date date NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    priority character varying DEFAULT 'MEDIUM'::public.taskpriority NOT NULL,
    status character varying DEFAULT 'PENDING'::public.taskstatus NOT NULL,
    assigned_date date NOT NULL,
    employee_id integer NOT NULL
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
-- Name: milestones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.milestones ALTER COLUMN id SET DEFAULT nextval('public.milestones_id_seq'::regclass);


--
-- Name: payslips id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips ALTER COLUMN id SET DEFAULT nextval('public.payslips_id_seq'::regclass);


--
-- Name: recruitment_stats id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_stats ALTER COLUMN id SET DEFAULT nextval('public.recruitment_stats_id_seq'::regclass);


--
-- Name: salary_components id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_components ALTER COLUMN id SET DEFAULT nextval('public.salary_components_id_seq'::regclass);


--
-- Name: scheduled_posts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_posts ALTER COLUMN id SET DEFAULT nextval('public.scheduled_posts_id_seq'::regclass);


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
838d81288ea1
\.


--
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, employee_id, date, status, created_at) FROM stdin;
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budgets (id, total_budget, start_date, end_date, status, created_at, updated_at) FROM stdin;
1	1000.00	2025-04-18	2025-04-19	active	2025-04-18 18:28:37.231355	2025-04-18 18:28:37.231355
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
1	Macherla Akhila	akhilamarchela0987@gmail.com	09030848641	Employee	3	Machine Learning,python	uploads/resumes/1_20250418_183527.pdf	applied	active	b	2025-04-18 18:35:08.712134	2025-04-18 18:35:27.723183
\.


--
-- Data for Name: client_feedbacks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_feedbacks (id, client_email, feedback, rating, remarks, form_token, form_expires_at, is_submitted, created_at, updated_at) FROM stdin;
2	akhilamarchela0987@gmail.com	Good service	4	\N	Qo8rGNvBiTdjg1kShj0KeHIMEcQ6Z7klayh-17Y9j7o	2025-04-30 12:22:44.799874	t	2025-04-23 12:22:44.801805	2025-04-23 12:23:01.902492
\.


--
-- Data for Name: department_budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.department_budgets (id, budget_id, department, allocated_amount, spent_amount, created_at, updated_at) FROM stdin;
14	1	Design	100.00	50.00	2025-04-18 19:50:33.631649	2025-04-18 20:30:05.610014
13	1	HR	100.00	40.00	2025-04-18 19:50:33.619938	2025-04-23 17:46:05.45823
\.


--
-- Data for Name: document_folders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_folders (id, name, description, is_confidential, access_key, created_at, created_by) FROM stdin;
19	Admin	\N	f	\N	2025-04-20 13:27:28.355348	3
20	HR	\N	t	\N	2025-04-23 12:17:10.59764	1
21	Employees	\N	f	\N	2025-04-23 12:18:18.385656	1
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, employee_id, name, type, url, upload_date, uploader_id, folder_id) FROM stdin;
\.


--
-- Data for Name: employee_feedbacks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employee_feedbacks (id, from_employee_id, to_employee_id, feedback, rating, remarks, created_at, updated_at) FROM stdin;
2	1	1	Good work	4	\N	2025-04-22 05:35:31.110861	2025-04-22 05:35:31.110866
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, name, email, phone, "position", department, salary, hire_date, status, created_at, updated_at, address) FROM stdin;
12	John Doe	john.doe@example.com	+1234567890	Frontend Developer	Engineering	75000.00	2023-01-15	active	2025-04-23 15:44:11.386336	2025-04-23 15:44:11.386336	\N
8	Macherla Akhila	akhilamarchela0987@gmail.com	+919030848641	Employee	Engineering	1000.00	2025-04-23	active	2025-04-23 08:51:34.944676	2025-04-24 15:16:01.85085	RAM NAGAR, musheerabad
10	siva	ak@gmail.com	123854	Employee	it	1000.00	2025-04-23	active	2025-04-23 11:10:52.565598	2025-04-24 15:28:55.842739	RAM NAGAR
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.expenses (id, type, amount, department, date, description, receipt_url, created_at, updated_at) FROM stdin;
8	Design	50.00	Design	2025-04-17	poster making	/uploads/receipts/226040df-37dc-4e02-8305-ad74fb4046d2.pdf	2025-04-18 19:48:06.497	2025-04-18 19:48:06.497
9	Marketing	40.00	HR	2025-04-23	Campaign	/uploads/receipts/7f0cbbde-9861-4551-be27-b78e3aeaa51b.pdf	2025-04-23 17:46:05.45823	2025-04-23 17:46:05.45823
\.


--
-- Data for Name: general_expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.general_expenses (id, title, amount, date, description, category, payment_method, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leads (id, name, company, email, phone, source, status, notes, expected_value, assigned_to, created_at, updated_at) FROM stdin;
1	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	website	NEW	.	\N	1	2025-04-22 12:38:46.230144	2025-04-22 12:38:46.230144
2	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	m	NEW		\N	1	2025-04-22 12:47:51.668789	2025-04-22 12:47:51.668789
3	Sunder	vijaybhoomi university	9030848641@axl	09030848641	frnds	NEW	nnnnnn	\N	1	2025-04-22 12:54:08.965473	2025-04-22 12:54:08.965473
4	shubam	vijaybhoomi university	9030848641@axl	09030848641	frnd	NEW	nnn	0	1	2025-04-22 12:58:03.164015	2025-04-22 12:58:03.164015
5	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	5(7-2x)	NEW	nnnnnn	0	1	2025-04-22 12:58:47.955953	2025-04-22 12:58:47.955953
6	n	vijaybhoomi university	9030848641@axl	09030848641	5(7-2x)	NEW	m	0	1	2025-04-22 12:59:18.967848	2025-04-22 12:59:18.967848
7	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	frnds	NEW	nnnnnn	0	1	2025-04-22 13:15:23.415409	2025-04-22 13:15:23.415409
8	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	frnds	NEW	nnnnnn	0	1	2025-04-22 16:09:05.894263	2025-04-22 16:09:05.894263
9	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	frnds	NEW	m	0	1	2025-04-22 16:13:20.284808	2025-04-22 16:13:20.284808
10	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	5(7-2x)	NEW	n	0	1	2025-04-22 16:16:21.016801	2025-04-22 16:16:21.016801
11	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	frnds	NEW	nnnnnn	0	1	2025-04-22 16:18:52.991324	2025-04-22 16:18:52.991324
12	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	frnds	NEW	nnnnnn	0	1	2025-04-22 18:07:08.999716	2025-04-22 18:07:08.999716
13	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	frnds	NEW	nnnnnn	0	1	2025-04-22 18:15:26.70553	2025-04-22 18:15:26.70553
14	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	frnds	NEW	nnnnnn	0	1	2025-04-22 18:21:13.969979	2025-04-22 18:21:13.969979
15	Macherla Akhila	vijaybhoomi university	akhilamarchela0987@gmail.com	09030848641	frnds	NEW	nnnnnn	0	1	2025-04-23 15:28:03.617711	2025-04-23 15:28:03.617711
\.


--
-- Data for Name: leave_balances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_balances (id, employee_id, year, casual_leave, sick_leave, annual_leave, created_at, updated_at) FROM stdin;
1	1	2025	12	15	20	2025-04-18 14:59:58.671913	2025-04-18 14:59:58.671918
2	2	2025	12	15	20	2025-04-19 05:05:53.083594	2025-04-19 05:05:53.083605
3	3	2025	12	15	20	2025-04-20 14:13:32.941815	2025-04-20 14:13:32.941821
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_requests (id, employee_id, leave_type, start_date, end_date, reason, status, approved_by, rejection_reason, created_at, updated_at) FROM stdin;
1	1	CASUAL	2025-04-19	2025-04-21	Sick	PENDING	\N	\N	2025-04-19 09:42:41.388285	2025-04-19 09:42:41.388289
\.


--
-- Data for Name: milestones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.milestones (id, employee_id, title, description, created_at, achieved_date, type) FROM stdin;
\.


--
-- Data for Name: payslips; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payslips (id, employee_id, month, year, base_salary, total_earnings, total_deductions, net_salary, components, status, generated_at, sent_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: recruitment_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recruitment_stats (id, total_candidates, active_candidates, hired_candidates, applied_candidates, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: salary_components; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.salary_components (id, name, type, amount, is_percentage, description, employee_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: scheduled_posts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scheduled_posts (id, campaign_id, content, platforms, scheduled_time, image_url, link_url, target_audience, status, performance_metrics, created_at, updated_at) FROM stdin;
1	1	nnnnnnnnnn	instagram	2025-04-17 11:05:00	\N	\N	{}	SCHEDULED	{}	2025-04-22 05:35:12.536676	2025-04-22 05:35:12.536685
\.


--
-- Data for Name: social_media_campaigns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_media_campaigns (id, name, description, platforms, budget, spent, roi, start_date, end_date, status, created_at, updated_at) FROM stdin;
1	Summer offer	poster making	facebook	150	0	-100	2025-04-22	2025-04-27	ACTIVE	2025-04-22 05:34:52.372335	2025-04-22 05:34:59.259707
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, due_date, created_at, updated_at, priority, status, assigned_date, employee_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, hashed_password, role, is_active, is_verified, verification_token, verification_token_expires, created_at) FROM stdin;
1	Admin	equitywalaa@gmail.com	$2b$12$5E9.hKTlERr2QR4l7..T1OntownaP7hBYDMMid8ye9LYcVu84GXRS	admin	t	t	\N	\N	2025-04-18 12:57:20.286001
2	Akhila	akhilamarchela0987@gmail.com	$2b$12$0ECjXYCc/iKuHScRtPs9seP/WupQ.mfc1dRDdiMWqY2P9aKzSkf.O	admin	t	t	\N	\N	2025-04-19 04:24:11.115511
3	Macherla Akhila	satyamacherla078@gmail.com	$2b$12$X.Dkv7t3wg2cnVj6h8MKy.ldo5hurNncCH3i2QYd/kMyAJlXCXM42	employee	t	t	\N	\N	2025-04-19 05:10:41.437712
\.


--
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 1, false);


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

SELECT pg_catalog.setval('public.candidates_id_seq', 1, true);


--
-- Name: client_feedbacks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_feedbacks_id_seq', 2, true);


--
-- Name: department_budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.department_budgets_id_seq', 14, true);


--
-- Name: document_folders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_folders_id_seq', 21, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 6, true);


--
-- Name: employee_feedbacks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employee_feedbacks_id_seq', 2, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 12, true);


--
-- Name: expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.expenses_id_seq', 9, true);


--
-- Name: general_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.general_expenses_id_seq', 1, false);


--
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leads_id_seq', 15, true);


--
-- Name: leave_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_balances_id_seq', 3, true);


--
-- Name: leave_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_requests_id_seq', 1, true);


--
-- Name: milestones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.milestones_id_seq', 1, false);


--
-- Name: payslips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payslips_id_seq', 1, false);


--
-- Name: recruitment_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recruitment_stats_id_seq', 1, false);


--
-- Name: salary_components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.salary_components_id_seq', 1, false);


--
-- Name: scheduled_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scheduled_posts_id_seq', 1, true);


--
-- Name: social_media_campaigns_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.social_media_campaigns_id_seq', 1, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tasks_id_seq', 3, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


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
-- Name: milestones milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.milestones
    ADD CONSTRAINT milestones_pkey PRIMARY KEY (id);


--
-- Name: payslips payslips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_pkey PRIMARY KEY (id);


--
-- Name: recruitment_stats recruitment_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_stats
    ADD CONSTRAINT recruitment_stats_pkey PRIMARY KEY (id);


--
-- Name: salary_components salary_components_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_components
    ADD CONSTRAINT salary_components_pkey PRIMARY KEY (id);


--
-- Name: scheduled_posts scheduled_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_posts
    ADD CONSTRAINT scheduled_posts_pkey PRIMARY KEY (id);


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
-- Name: ix_payslips_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_payslips_id ON public.payslips USING btree (id);


--
-- Name: ix_recruitment_stats_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_recruitment_stats_id ON public.recruitment_stats USING btree (id);


--
-- Name: ix_salary_components_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_salary_components_id ON public.salary_components USING btree (id);


--
-- Name: ix_scheduled_posts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_scheduled_posts_id ON public.scheduled_posts USING btree (id);


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
    ADD CONSTRAINT documents_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.document_folders(id) ON DELETE SET NULL;


--
-- Name: documents documents_uploader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: employee_feedbacks employee_feedbacks_from_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_feedbacks
    ADD CONSTRAINT employee_feedbacks_from_employee_id_fkey FOREIGN KEY (from_employee_id) REFERENCES public.users(id);


--
-- Name: employee_feedbacks employee_feedbacks_to_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_feedbacks
    ADD CONSTRAINT employee_feedbacks_to_employee_id_fkey FOREIGN KEY (to_employee_id) REFERENCES public.users(id);


--
-- Name: leads leads_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


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
-- Name: payslips payslips_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: salary_components salary_components_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_components
    ADD CONSTRAINT salary_components_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: scheduled_posts scheduled_posts_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scheduled_posts
    ADD CONSTRAINT scheduled_posts_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.social_media_campaigns(id) ON DELETE SET NULL;


--
-- Name: tasks tasks_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

