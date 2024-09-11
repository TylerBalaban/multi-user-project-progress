
--
-- TOC entry 284 (class 1259 OID 29037)
-- Name: features; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.features (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid,
    "order" bigint,
    created_at timestamp with time zone DEFAULT now(),
    name text
);


ALTER TABLE public.features OWNER TO postgres;

--
-- TOC entry 282 (class 1259 OID 29008)
-- Name: invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    role text NOT NULL,
    status text DEFAULT '''pending''::text'::text NOT NULL,
    email text NOT NULL
);


ALTER TABLE public.invitations OWNER TO postgres;

--
-- TOC entry 283 (class 1259 OID 29020)
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    name text,
    description text,
    slug text,
    visibility text
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- TOC entry 285 (class 1259 OID 29049)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feature_id uuid,
    progress integer,
    created_at timestamp with time zone,
    name text
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 281 (class 1259 OID 28991)
-- Name: team_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid,
    user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    email text,
    role text NOT NULL,
    status text NOT NULL
);


ALTER TABLE public.team_members OWNER TO postgres;

--
-- TOC entry 280 (class 1259 OID 28984)
-- Name: teams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    name text NOT NULL
);


ALTER TABLE public.teams OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 28977)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    default_team_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    email text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

