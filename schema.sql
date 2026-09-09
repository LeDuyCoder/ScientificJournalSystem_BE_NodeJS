WARNING:  database "postgres" has a collation version mismatch
DETAIL:  The database was created using collation version 2.41, but the operating system provides version 2.36.
HINT:  Rebuild all objects in this database that use the default collation and run ALTER DATABASE postgres REFRESH COLLATION VERSION, or build PostgreSQL with the right library version.
--
-- PostgreSQL database dump
--

\restrict ePIJOMdBQUOZEoUuKeJ64K33num8gkAViGkhktotpvmhtxBABwuPGrY2bY6gMVx

-- Dumped from database version 16.14 (Debian 16.14-1.pgdg12+1)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pipeline; Type: SCHEMA; Schema: -; Owner: admin
--

CREATE SCHEMA pipeline;


ALTER SCHEMA pipeline OWNER TO admin;

--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: auth_provider; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.auth_provider AS ENUM (
    'LOCAL',
    'GOOGLE'
);


ALTER TYPE public.auth_provider OWNER TO admin;

--
-- Name: log_action; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.log_action AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'LOGOUT',
    'VIEW',
    'EXPORT',
    'IMPORT',
    'ERROR',
    'SYSTEM',
    'ACTIVATE'
);


ALTER TYPE public.log_action OWNER TO admin;

--
-- Name: log_level; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.log_level AS ENUM (
    'INFO',
    'WARNING',
    'ERROR',
    'CRITICAL'
);


ALTER TYPE public.log_level OWNER TO admin;

--
-- Name: log_source; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.log_source AS ENUM (
    'API',
    'ADMIN_PANEL',
    'SYSTEM',
    'CRON'
);


ALTER TYPE public.log_source OWNER TO admin;

--
-- Name: message_role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.message_role AS ENUM (
    'USER',
    'ASSISTANT',
    'SYSTEM'
);


ALTER TYPE public.message_role OWNER TO admin;

--
-- Name: message_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.message_status AS ENUM (
    'PENDING',
    'COMPLETED',
    'ERROR'
);


ALTER TYPE public.message_status OWNER TO admin;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.payment_method AS ENUM (
    'vnpay',
    'momo',
    'bank_transfer',
    'stripe',
    'paypal'
);


ALTER TYPE public.payment_method OWNER TO admin;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'success',
    'failed',
    'cancelled',
    'refunded'
);


ALTER TYPE public.payment_status OWNER TO admin;

--
-- Name: project_member_role; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.project_member_role AS ENUM (
    'OWNER',
    'ADMIN',
    'MEMBER',
    'VIEWER'
);


ALTER TYPE public.project_member_role OWNER TO admin;

--
-- Name: project_member_status; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.project_member_status AS ENUM (
    'INVITED',
    'ACCEPTED',
    'REJECTED',
    'REMOVED'
);


ALTER TYPE public.project_member_status OWNER TO admin;

--
-- Name: ranking_metric_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.ranking_metric_type AS ENUM (
    'QUARTILE',
    'SCORE',
    'INTEGER'
);


ALTER TYPE public.ranking_metric_type OWNER TO admin;

--
-- Name: ranking_source; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.ranking_source AS ENUM (
    'SCOPUS',
    'WOS',
    'SCIMAGO'
);


ALTER TYPE public.ranking_source OWNER TO admin;

--
-- Name: role_account; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.role_account AS ENUM (
    'STUDENT',
    'LECTURER',
    'RESEARCHER',
    'ADMINISTRATOR'
);


ALTER TYPE public.role_account OWNER TO admin;

--
-- Name: source_zone; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.source_zone AS ENUM (
    'ISO',
    'SCIMAGO',
    'OPENALEX',
    'INTERNAL'
);


ALTER TYPE public.source_zone OWNER TO admin;

--
-- Name: status_account; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.status_account AS ENUM (
    'INACTIVE',
    'ACTIVE',
    'BANNED'
);


ALTER TYPE public.status_account OWNER TO admin;

--
-- Name: status_project; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.status_project AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ARCHIVED',
    'DELETED'
);


ALTER TYPE public.status_project OWNER TO admin;

--
-- Name: type_zone; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.type_zone AS ENUM (
    'COUNTRY',
    'REGION'
);


ALTER TYPE public.type_zone OWNER TO admin;

--
-- Name: wallet_transaction_type; Type: TYPE; Schema: public; Owner: admin
--

CREATE TYPE public.wallet_transaction_type AS ENUM (
    'deposit',
    'spend',
    'refund',
    'admin_adjust'
);


ALTER TYPE public.wallet_transaction_type OWNER TO admin;

--
-- Name: match_articles(public.vector, double precision, integer); Type: FUNCTION; Schema: public; Owner: admin
--

CREATE FUNCTION public.match_articles(query_embedding public.vector, match_threshold double precision, match_count integer) RETURNS TABLE(article_id bigint, similarity double precision)
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT
        a.article_id,
        (1 - (a.embedding <=> query_embedding))::double precision AS similarity
      FROM "Article" a
      WHERE a.embedding IS NOT NULL
        AND (1 - (a.embedding <=> query_embedding)) >= match_threshold
      ORDER BY a.embedding <=> query_embedding
      LIMIT match_count;
    END;
    $$;


ALTER FUNCTION public.match_articles(query_embedding public.vector, match_threshold double precision, match_count integer) OWNER TO admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: article_manifest_items; Type: TABLE; Schema: pipeline; Owner: admin
--

CREATE TABLE pipeline.article_manifest_items (
    manifest_name text NOT NULL,
    article_id bigint NOT NULL,
    selected_rank integer NOT NULL,
    selection_reason text NOT NULL,
    subject_area_id bigint,
    primary_topic bigint,
    quality_score smallint NOT NULL,
    citation_count integer NOT NULL,
    reference_count integer NOT NULL,
    publication_year integer,
    CONSTRAINT article_manifest_items_selected_rank_check CHECK ((selected_rank > 0)),
    CONSTRAINT article_manifest_items_selection_reason_check CHECK ((selection_reason = ANY (ARRAY['bookmarked'::text, 'topic_representative'::text, 'subject_area_balanced'::text])))
);


ALTER TABLE pipeline.article_manifest_items OWNER TO admin;

--
-- Name: article_manifests; Type: TABLE; Schema: pipeline; Owner: admin
--

CREATE TABLE pipeline.article_manifests (
    manifest_name text NOT NULL,
    target_count integer NOT NULL,
    selected_count integer NOT NULL,
    source_article_count bigint NOT NULL,
    algorithm_version text NOT NULL,
    selection_checksum text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    activated_at timestamp with time zone,
    CONSTRAINT article_manifests_check CHECK ((source_article_count >= selected_count)),
    CONSTRAINT article_manifests_selected_count_check CHECK ((selected_count > 0)),
    CONSTRAINT article_manifests_target_count_check CHECK ((target_count > 0))
);


ALTER TABLE pipeline.article_manifests OWNER TO admin;

--
-- Name: article_prune_runs; Type: TABLE; Schema: pipeline; Owner: admin
--

CREATE TABLE pipeline.article_prune_runs (
    run_name text NOT NULL,
    manifest_name text NOT NULL,
    manifest_checksum text NOT NULL,
    status text NOT NULL,
    current_stage text,
    deleted_rows jsonb DEFAULT '{}'::jsonb NOT NULL,
    initial_report jsonb NOT NULL,
    backup_path text NOT NULL,
    batch_size integer NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    last_error text,
    CONSTRAINT article_prune_runs_batch_size_check CHECK ((batch_size > 0)),
    CONSTRAINT article_prune_runs_status_check CHECK ((status = ANY (ARRAY['running'::text, 'paused'::text, 'failed'::text, 'completed'::text])))
);


ALTER TABLE pipeline.article_prune_runs OWNER TO admin;

--
-- Name: Article; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Article" (
    article_id bigint NOT NULL,
    version character varying,
    issue_id bigint,
    title character varying NOT NULL,
    abstract character varying,
    publication_year integer,
    doi character varying,
    primary_topic bigint,
    semantic_scholar_id character varying,
    citation_count integer,
    semantic_influential_citation_count integer,
    semantic_external_ids json,
    semantic_tldr character varying,
    "references" json,
    reference_count integer,
    created_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    embedding public.vector
);


ALTER TABLE public."Article" OWNER TO admin;

--
-- Name: COLUMN "Article".version; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Article".version IS 'Phiên bản bài báo';


--
-- Name: Article_article_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Article" ALTER COLUMN article_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Article_article_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Author; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Author" (
    author_id bigint NOT NULL,
    orcid character varying,
    display_name character varying,
    url_image character varying,
    openalex_id character varying,
    works_count bigint,
    cited_by_count bigint,
    h_index bigint,
    i10_index bigint,
    is_deleted boolean DEFAULT false,
    last_known_institution character varying,
    last_known_institution_id character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Author" OWNER TO admin;

--
-- Name: COLUMN "Author".orcid; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Author".orcid IS 'Mã định danh quốc tế của tác giả';


--
-- Name: Author_Article; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Author_Article" (
    author_id bigint NOT NULL,
    article_id bigint NOT NULL
);


ALTER TABLE public."Author_Article" OWNER TO admin;

--
-- Name: Author_author_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Author" ALTER COLUMN author_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Author_author_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Institution; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Institution" (
    institution_id bigint NOT NULL,
    display_name character varying NOT NULL,
    country_code character varying,
    type character varying,
    is_deleted boolean DEFAULT false NOT NULL,
    openalex_id character varying(100)
);


ALTER TABLE public."Institution" OWNER TO admin;

--
-- Name: Institution_Author; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Institution_Author" (
    author_id bigint NOT NULL,
    institution_id bigint NOT NULL,
    year integer NOT NULL
);


ALTER TABLE public."Institution_Author" OWNER TO admin;

--
-- Name: Institution_institution_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Institution" ALTER COLUMN institution_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Institution_institution_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Issue; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Issue" (
    issue_id bigint NOT NULL,
    volume_id bigint,
    issue_number character varying,
    publication_year integer,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public."Issue" OWNER TO admin;

--
-- Name: Issue_issue_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Issue" ALTER COLUMN issue_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Issue_issue_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Journal; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Journal" (
    journal_id bigint NOT NULL,
    source_id character varying,
    publisher_id bigint,
    country bigint,
    region bigint,
    display_name character varying,
    type character varying,
    is_open_access boolean,
    is_oa_diamond boolean,
    coverage character varying,
    issn character varying,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public."Journal" OWNER TO admin;

--
-- Name: COLUMN "Journal".source_id; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal".source_id IS 'ID gốc từ Scimago (Sourceid) hoặc OpenAlex để đồng bộ';


--
-- Name: COLUMN "Journal".country; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal".country IS 'Quốc gia/khu vực quản lý tạp chí';


--
-- Name: COLUMN "Journal".region; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal".region IS 'Quốc gia/khu vực quản lý tạp chí';


--
-- Name: COLUMN "Journal".display_name; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal".display_name IS 'Tên tạp chí';


--
-- Name: COLUMN "Journal".type; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal".type IS 'journal, book series, conference and proceedings, trade journal';


--
-- Name: COLUMN "Journal".is_open_access; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal".is_open_access IS 'Trường Open Access (Yes/No) từ Scimago 2025';


--
-- Name: COLUMN "Journal".is_oa_diamond; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal".is_oa_diamond IS 'Trường Open Access Diamond (Yes/No) từ Scimago 2025';


--
-- Name: COLUMN "Journal".coverage; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal".coverage IS 'Thời gian bao phủ dữ liệu (Ví dụ: 1950-2026)';


--
-- Name: Journal_Ranking; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Journal_Ranking" (
    journal_ranking_id bigint NOT NULL,
    journal_id bigint NOT NULL,
    subject_category_id bigint,
    metric_id bigint NOT NULL,
    year integer NOT NULL,
    value_txt character varying,
    value_int integer,
    value_float double precision,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public."Journal_Ranking" OWNER TO admin;

--
-- Name: TABLE "Journal_Ranking"; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public."Journal_Ranking" IS 'Bảng lưu trữ động toàn bộ chỉ số xếp hạng theo năm của Tạp chí';


--
-- Name: COLUMN "Journal_Ranking".subject_category_id; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal_Ranking".subject_category_id IS 'Null nếu là chỉ số chung của Tạp chí (như H-index, Total Docs). Có giá trị nếu là Rank hoặc Quartile riêng của Tạp chí trong Chuyên ngành đó';


--
-- Name: COLUMN "Journal_Ranking".year; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal_Ranking".year IS 'Ví dụ: 2025';


--
-- Name: COLUMN "Journal_Ranking".value_txt; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal_Ranking".value_txt IS 'Lưu giá trị nếu metric_type = QUARTILE (Ví dụ: Q1)';


--
-- Name: COLUMN "Journal_Ranking".value_int; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal_Ranking".value_int IS 'Lưu giá trị nếu metric_type = INTEGER (Ví dụ: 236, 4331)';


--
-- Name: COLUMN "Journal_Ranking".value_float; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Journal_Ranking".value_float IS 'Lưu giá trị nếu metric_type = SCORE (Ví dụ: 104.065, 46.34)';


--
-- Name: Journal_Ranking_Subject_Category; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Journal_Ranking_Subject_Category" (
    journal_ranking_id bigint,
    subject_category_id bigint
);


ALTER TABLE public."Journal_Ranking_Subject_Category" OWNER TO admin;

--
-- Name: Journal_Ranking_journal_ranking_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Journal_Ranking" ALTER COLUMN journal_ranking_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Journal_Ranking_journal_ranking_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Journal_Subject_Category; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Journal_Subject_Category" (
    journal_id bigint NOT NULL,
    subject_category_id bigint NOT NULL
);


ALTER TABLE public."Journal_Subject_Category" OWNER TO admin;

--
-- Name: Journal_journal_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Journal" ALTER COLUMN journal_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Journal_journal_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Keyword; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Keyword" (
    keyword_id bigint NOT NULL,
    display_name character varying
);


ALTER TABLE public."Keyword" OWNER TO admin;

--
-- Name: Keyword_Article; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Keyword_Article" (
    keyword_id bigint NOT NULL,
    article_id bigint NOT NULL,
    score double precision
);


ALTER TABLE public."Keyword_Article" OWNER TO admin;

--
-- Name: COLUMN "Keyword_Article".score; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Keyword_Article".score IS 'Trọng số của từ khóa đối với riêng bài báo này';


--
-- Name: Keyword_keyword_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Keyword" ALTER COLUMN keyword_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Keyword_keyword_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Password_Reset_Token; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Password_Reset_Token" (
    token_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public."Password_Reset_Token" OWNER TO admin;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Project" (
    project_id bigint NOT NULL,
    user_id uuid,
    subject_area bigint,
    title character varying,
    created_at timestamp without time zone,
    status public.status_project DEFAULT 'INACTIVE'::public.status_project
);


ALTER TABLE public."Project" OWNER TO admin;

--
-- Name: COLUMN "Project".user_id; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Project".user_id IS 'Chủ sở hữu project';


--
-- Name: Project_Article_Bookmark; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Project_Article_Bookmark" (
    project_id bigint NOT NULL,
    article_id bigint NOT NULL,
    user_id uuid NOT NULL,
    added_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public."Project_Article_Bookmark" OWNER TO admin;

--
-- Name: Project_Chat_Message; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Project_Chat_Message" (
    message_id bigint NOT NULL,
    project_id bigint NOT NULL,
    role public.message_role,
    content text NOT NULL,
    model character varying,
    prompt_tokens integer,
    completion_tokens integer,
    total_tokens integer,
    latency_ms integer,
    status public.message_status DEFAULT 'COMPLETED'::public.message_status,
    created_at timestamp without time zone DEFAULT now(),
    user_id uuid
);


ALTER TABLE public."Project_Chat_Message" OWNER TO admin;

--
-- Name: Project_Chat_Message_message_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Project_Chat_Message" ALTER COLUMN message_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Project_Chat_Message_message_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Project_Journal; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Project_Journal" (
    project_id bigint,
    journal_id bigint
);


ALTER TABLE public."Project_Journal" OWNER TO admin;

--
-- Name: Project_Keyword; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Project_Keyword" (
    project_id bigint,
    keyword_id bigint
);


ALTER TABLE public."Project_Keyword" OWNER TO admin;

--
-- Name: Project_Member; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Project_Member" (
    project_member_id bigint NOT NULL,
    project_id bigint NOT NULL,
    user_id uuid,
    invited_email character varying NOT NULL,
    role public.project_member_role DEFAULT 'MEMBER'::public.project_member_role,
    status public.project_member_status DEFAULT 'INVITED'::public.project_member_status,
    invited_by uuid,
    invited_at timestamp without time zone DEFAULT now(),
    accepted_at timestamp without time zone,
    removed_at timestamp without time zone
);


ALTER TABLE public."Project_Member" OWNER TO admin;

--
-- Name: COLUMN "Project_Member".user_id; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Project_Member".user_id IS 'Có user_id khi người được mời đã có tài khoản';


--
-- Name: COLUMN "Project_Member".invited_email; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Project_Member".invited_email IS 'Email người được mời';


--
-- Name: COLUMN "Project_Member".invited_by; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Project_Member".invited_by IS 'Ai gửi lời mời';


--
-- Name: Project_Member_project_member_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Project_Member" ALTER COLUMN project_member_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Project_Member_project_member_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Project_project_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Project" ALTER COLUMN project_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Project_project_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Publisher; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Publisher" (
    publisher_id bigint NOT NULL,
    display_name character varying,
    image_url character varying,
    created_at timestamp without time zone,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public."Publisher" OWNER TO admin;

--
-- Name: Publisher_publisher_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Publisher" ALTER COLUMN publisher_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Publisher_publisher_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Ranking_Metric; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Ranking_Metric" (
    metric_id bigint NOT NULL,
    code character varying,
    display_name character varying,
    metric_type public.ranking_metric_type,
    description character varying
);


ALTER TABLE public."Ranking_Metric" OWNER TO admin;

--
-- Name: COLUMN "Ranking_Metric".code; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Ranking_Metric".code IS 'Mã định danh chỉ số để map code hệ thống';


--
-- Name: COLUMN "Ranking_Metric".display_name; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Ranking_Metric".display_name IS 'Tên hiển thị từ file excel';


--
-- Name: Ranking_Metric_metric_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Ranking_Metric" ALTER COLUMN metric_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Ranking_Metric_metric_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Sub_Topic; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Sub_Topic" (
    article_id bigint NOT NULL,
    topic_id bigint NOT NULL
);


ALTER TABLE public."Sub_Topic" OWNER TO admin;

--
-- Name: Subject_Area; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Subject_Area" (
    subject_area_id bigint NOT NULL,
    display_name character varying,
    description character varying,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public."Subject_Area" OWNER TO admin;

--
-- Name: COLUMN "Subject_Area".display_name; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Subject_Area".display_name IS 'Lĩnh vực lớn (Ví dụ: Medicine, Social Sciences từ Scimago)';


--
-- Name: Subject_Area_subject_area_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Subject_Area" ALTER COLUMN subject_area_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Subject_Area_subject_area_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Subject_Category; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Subject_Category" (
    subject_category_id bigint NOT NULL,
    subject_area_id bigint,
    display_name character varying,
    description character varying,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public."Subject_Category" OWNER TO admin;

--
-- Name: COLUMN "Subject_Category".subject_area_id; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Subject_Category".subject_area_id IS 'Thuộc về lĩnh vực lớn nào';


--
-- Name: COLUMN "Subject_Category".display_name; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Subject_Category".display_name IS 'Chuyên ngành hẹp (Ví dụ: Oncology, Cultural Studies)';


--
-- Name: Subject_Category_Project; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Subject_Category_Project" (
    project_id bigint,
    subject_category_id bigint
);


ALTER TABLE public."Subject_Category_Project" OWNER TO admin;

--
-- Name: Subject_Category_subject_category_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Subject_Category" ALTER COLUMN subject_category_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Subject_Category_subject_category_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: System_Log; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."System_Log" (
    log_id bigint NOT NULL,
    user_id uuid,
    user_role public.role_account,
    action public.log_action NOT NULL,
    level public.log_level DEFAULT 'INFO'::public.log_level,
    source public.log_source DEFAULT 'API'::public.log_source,
    entity_table character varying,
    entity_id character varying,
    message character varying,
    old_data json,
    new_data json,
    metadata json,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public."System_Log" OWNER TO admin;

--
-- Name: TABLE "System_Log"; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON TABLE public."System_Log" IS 'Bảng ghi log tập trung cho toàn bộ hệ thống';


--
-- Name: COLUMN "System_Log".user_id; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."System_Log".user_id IS 'Null nếu system hoặc anonymous';


--
-- Name: COLUMN "System_Log".user_role; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."System_Log".user_role IS 'Role tại thời điểm thực hiện';


--
-- Name: COLUMN "System_Log".entity_table; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."System_Log".entity_table IS 'Tên bảng: Article, Journal, Project, User...';


--
-- Name: COLUMN "System_Log".entity_id; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."System_Log".entity_id IS 'ID bản ghi (string để dùng chung uuid/bigint)';


--
-- Name: COLUMN "System_Log".message; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."System_Log".message IS 'Mô tả ngắn gọn cho con người đọc';


--
-- Name: COLUMN "System_Log".old_data; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."System_Log".old_data IS 'Snapshot dữ liệu trước khi thay đổi';


--
-- Name: COLUMN "System_Log".new_data; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."System_Log".new_data IS 'Snapshot dữ liệu sau khi thay đổi';


--
-- Name: COLUMN "System_Log".metadata; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."System_Log".metadata IS 'IP, User-Agent, request_id, endpoint, payload...';


--
-- Name: System_Log_log_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."System_Log" ALTER COLUMN log_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."System_Log_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Topic; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Topic" (
    topic_id bigint NOT NULL,
    display_name character varying,
    score double precision,
    subject_area_id bigint,
    subject_category_id bigint,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public."Topic" OWNER TO admin;

--
-- Name: Topic_topic_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Topic" ALTER COLUMN topic_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Topic_topic_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Volume; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Volume" (
    volume_id bigint NOT NULL,
    journal_id bigint,
    volume_number integer,
    publication_year integer,
    is_deleted boolean DEFAULT false
);


ALTER TABLE public."Volume" OWNER TO admin;

--
-- Name: Volume_volume_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Volume" ALTER COLUMN volume_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Volume_volume_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: Zone; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Zone" (
    zone_id bigint NOT NULL,
    code character varying,
    name character varying,
    type public.type_zone,
    iso_code character varying,
    source public.source_zone,
    created_at timestamp without time zone
);


ALTER TABLE public."Zone" OWNER TO admin;

--
-- Name: COLUMN "Zone".code; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Zone".code IS 'Ví dụ: VN, ASIA, EU, GLOBAL';


--
-- Name: COLUMN "Zone".name; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."Zone".name IS 'Tên quốc gia hoặc khu vực';


--
-- Name: Zone_zone_id_seq; Type: SEQUENCE; Schema: public; Owner: admin
--

ALTER TABLE public."Zone" ALTER COLUMN zone_id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public."Zone_zone_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: coin_package; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.coin_package (
    package_id uuid NOT NULL,
    name character varying NOT NULL,
    coin_amount bigint NOT NULL,
    bonus_coin bigint DEFAULT 0 NOT NULL,
    price numeric(18,2) NOT NULL,
    currency character varying DEFAULT 'VND'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.coin_package OWNER TO admin;

--
-- Name: COLUMN coin_package.name; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.coin_package.name IS 'Tên gói coin';


--
-- Name: COLUMN coin_package.coin_amount; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.coin_package.coin_amount IS 'Số coin nhận được';


--
-- Name: COLUMN coin_package.bonus_coin; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.coin_package.bonus_coin IS 'Coin khuyến mãi';


--
-- Name: COLUMN coin_package.price; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.coin_package.price IS 'Giá tiền thật';


--
-- Name: payment_transaction; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.payment_transaction (
    transaction_id uuid NOT NULL,
    user_id uuid NOT NULL,
    package_id uuid,
    amount numeric(18,2) NOT NULL,
    currency character varying DEFAULT 'VND'::character varying NOT NULL,
    coin_amount bigint NOT NULL,
    bonus_coin bigint DEFAULT 0 NOT NULL,
    total_coin bigint NOT NULL,
    payment_method public.payment_method NOT NULL,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    provider_transaction_code character varying,
    note character varying,
    created_at timestamp without time zone,
    paid_at timestamp without time zone
);


ALTER TABLE public.payment_transaction OWNER TO admin;

--
-- Name: COLUMN payment_transaction.amount; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.payment_transaction.amount IS 'Số tiền thanh toán';


--
-- Name: COLUMN payment_transaction.total_coin; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.payment_transaction.total_coin IS 'Tổng coin nhận được';


--
-- Name: COLUMN payment_transaction.payment_method; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.payment_transaction.payment_method IS 'Phương thức thanh toán';


--
-- Name: COLUMN payment_transaction.payment_status; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.payment_transaction.payment_status IS 'Trạng thái thanh toán';


--
-- Name: COLUMN payment_transaction.provider_transaction_code; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.payment_transaction.provider_transaction_code IS 'Mã giao dịch từ cổng thanh toán';


--
-- Name: user; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."user" (
    user_id uuid NOT NULL,
    email character varying NOT NULL,
    password character varying,
    type public.auth_provider,
    status public.status_account,
    role public.role_account,
    last_name character varying,
    first_name character varying,
    url_image character varying,
    date_of_birth date,
    gender boolean
);


ALTER TABLE public."user" OWNER TO admin;

--
-- Name: COLUMN "user".password; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."user".password IS 'Mật khẩu đã mã hóa băm (hashing)';


--
-- Name: COLUMN "user".type; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."user".type IS 'Phương thức đăng nhập';


--
-- Name: COLUMN "user".status; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."user".status IS 'Trạng thái tài khoản';


--
-- Name: COLUMN "user".gender; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public."user".gender IS '0: Nữ, 1: Nam';


--
-- Name: wallet; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.wallet (
    wallet_id uuid NOT NULL,
    user_id uuid NOT NULL,
    balance bigint DEFAULT 0 NOT NULL,
    total_deposit bigint DEFAULT 0 NOT NULL,
    total_spent bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.wallet OWNER TO admin;

--
-- Name: COLUMN wallet.balance; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.wallet.balance IS 'Số coin hiện có';


--
-- Name: COLUMN wallet.total_deposit; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.wallet.total_deposit IS 'Tổng coin đã nạp';


--
-- Name: COLUMN wallet.total_spent; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.wallet.total_spent IS 'Tổng coin đã sử dụng';


--
-- Name: wallet_transaction; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.wallet_transaction (
    wallet_transaction_id uuid NOT NULL,
    wallet_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type public.wallet_transaction_type NOT NULL,
    amount bigint NOT NULL,
    balance_before bigint NOT NULL,
    balance_after bigint NOT NULL,
    payment_transaction_id uuid,
    description character varying,
    created_at timestamp without time zone
);


ALTER TABLE public.wallet_transaction OWNER TO admin;

--
-- Name: COLUMN wallet_transaction.type; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.wallet_transaction.type IS 'Loại giao dịch coin';


--
-- Name: COLUMN wallet_transaction.amount; Type: COMMENT; Schema: public; Owner: admin
--

COMMENT ON COLUMN public.wallet_transaction.amount IS 'Số coin thay đổi, cộng là dương, trừ là âm';


--
-- Name: article_manifest_items article_manifest_items_manifest_name_selected_rank_key; Type: CONSTRAINT; Schema: pipeline; Owner: admin
--

ALTER TABLE ONLY pipeline.article_manifest_items
    ADD CONSTRAINT article_manifest_items_manifest_name_selected_rank_key UNIQUE (manifest_name, selected_rank);


--
-- Name: article_manifest_items article_manifest_items_pkey; Type: CONSTRAINT; Schema: pipeline; Owner: admin
--

ALTER TABLE ONLY pipeline.article_manifest_items
    ADD CONSTRAINT article_manifest_items_pkey PRIMARY KEY (manifest_name, article_id);


--
-- Name: article_manifests article_manifests_pkey; Type: CONSTRAINT; Schema: pipeline; Owner: admin
--

ALTER TABLE ONLY pipeline.article_manifests
    ADD CONSTRAINT article_manifests_pkey PRIMARY KEY (manifest_name);


--
-- Name: article_prune_runs article_prune_runs_pkey; Type: CONSTRAINT; Schema: pipeline; Owner: admin
--

ALTER TABLE ONLY pipeline.article_prune_runs
    ADD CONSTRAINT article_prune_runs_pkey PRIMARY KEY (run_name);


--
-- Name: Article Article_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Article"
    ADD CONSTRAINT "Article_pkey" PRIMARY KEY (article_id);


--
-- Name: Author_Article Author_Article_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Author_Article"
    ADD CONSTRAINT "Author_Article_pkey" PRIMARY KEY (author_id, article_id);


--
-- Name: Author Author_orcid_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Author"
    ADD CONSTRAINT "Author_orcid_key" UNIQUE (orcid);


--
-- Name: Author Author_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Author"
    ADD CONSTRAINT "Author_pkey" PRIMARY KEY (author_id);


--
-- Name: Institution_Author Institution_Author_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Institution_Author"
    ADD CONSTRAINT "Institution_Author_pkey" PRIMARY KEY (author_id, institution_id, year);


--
-- Name: Institution Institution_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Institution"
    ADD CONSTRAINT "Institution_pkey" PRIMARY KEY (institution_id);


--
-- Name: Issue Issue_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_pkey" PRIMARY KEY (issue_id);


--
-- Name: Journal_Ranking Journal_Ranking_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal_Ranking"
    ADD CONSTRAINT "Journal_Ranking_pkey" PRIMARY KEY (journal_ranking_id);


--
-- Name: Journal_Subject_Category Journal_Subject_Category_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal_Subject_Category"
    ADD CONSTRAINT "Journal_Subject_Category_pkey" PRIMARY KEY (journal_id, subject_category_id);


--
-- Name: Journal Journal_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal"
    ADD CONSTRAINT "Journal_pkey" PRIMARY KEY (journal_id);


--
-- Name: Keyword_Article Keyword_Article_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Keyword_Article"
    ADD CONSTRAINT "Keyword_Article_pkey" PRIMARY KEY (keyword_id, article_id);


--
-- Name: Keyword Keyword_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Keyword"
    ADD CONSTRAINT "Keyword_pkey" PRIMARY KEY (keyword_id);


--
-- Name: Password_Reset_Token Password_Reset_Token_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Password_Reset_Token"
    ADD CONSTRAINT "Password_Reset_Token_pkey" PRIMARY KEY (token_id);


--
-- Name: Project_Article_Bookmark Project_Article_Bookmark_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Article_Bookmark"
    ADD CONSTRAINT "Project_Article_Bookmark_pkey" PRIMARY KEY (project_id, article_id, user_id);


--
-- Name: Project_Chat_Message Project_Chat_Message_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Chat_Message"
    ADD CONSTRAINT "Project_Chat_Message_pkey" PRIMARY KEY (message_id);


--
-- Name: Project_Member Project_Member_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Member"
    ADD CONSTRAINT "Project_Member_pkey" PRIMARY KEY (project_member_id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (project_id);


--
-- Name: Publisher Publisher_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Publisher"
    ADD CONSTRAINT "Publisher_pkey" PRIMARY KEY (publisher_id);


--
-- Name: Ranking_Metric Ranking_Metric_code_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Ranking_Metric"
    ADD CONSTRAINT "Ranking_Metric_code_key" UNIQUE (code);


--
-- Name: Ranking_Metric Ranking_Metric_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Ranking_Metric"
    ADD CONSTRAINT "Ranking_Metric_pkey" PRIMARY KEY (metric_id);


--
-- Name: Sub_Topic Sub_Topic_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Sub_Topic"
    ADD CONSTRAINT "Sub_Topic_pkey" PRIMARY KEY (article_id, topic_id);


--
-- Name: Subject_Area Subject_Area_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Subject_Area"
    ADD CONSTRAINT "Subject_Area_pkey" PRIMARY KEY (subject_area_id);


--
-- Name: Subject_Category Subject_Category_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Subject_Category"
    ADD CONSTRAINT "Subject_Category_pkey" PRIMARY KEY (subject_category_id);


--
-- Name: System_Log System_Log_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."System_Log"
    ADD CONSTRAINT "System_Log_pkey" PRIMARY KEY (log_id);


--
-- Name: Topic Topic_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Topic"
    ADD CONSTRAINT "Topic_pkey" PRIMARY KEY (topic_id);


--
-- Name: Volume Volume_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Volume"
    ADD CONSTRAINT "Volume_pkey" PRIMARY KEY (volume_id);


--
-- Name: Zone Zone_code_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Zone"
    ADD CONSTRAINT "Zone_code_key" UNIQUE (code);


--
-- Name: Zone Zone_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Zone"
    ADD CONSTRAINT "Zone_pkey" PRIMARY KEY (zone_id);


--
-- Name: coin_package coin_package_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.coin_package
    ADD CONSTRAINT coin_package_pkey PRIMARY KEY (package_id);


--
-- Name: payment_transaction payment_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_transaction
    ADD CONSTRAINT payment_transaction_pkey PRIMARY KEY (transaction_id);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (user_id);


--
-- Name: wallet wallet_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wallet
    ADD CONSTRAINT wallet_pkey PRIMARY KEY (wallet_id);


--
-- Name: wallet_transaction wallet_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wallet_transaction
    ADD CONSTRAINT wallet_transaction_pkey PRIMARY KEY (wallet_transaction_id);


--
-- Name: wallet wallet_user_id_key; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wallet
    ADD CONSTRAINT wallet_user_id_key UNIQUE (user_id);


--
-- Name: article_manifest_items_article_idx; Type: INDEX; Schema: pipeline; Owner: admin
--

CREATE INDEX article_manifest_items_article_idx ON pipeline.article_manifest_items USING btree (article_id);


--
-- Name: article_manifests_one_active_idx; Type: INDEX; Schema: pipeline; Owner: admin
--

CREATE UNIQUE INDEX article_manifests_one_active_idx ON pipeline.article_manifests USING btree (is_active) WHERE is_active;


--
-- Name: Project_Chat_Message_project_id_created_at_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Project_Chat_Message_project_id_created_at_idx" ON public."Project_Chat_Message" USING btree (project_id, created_at);


--
-- Name: Project_Member_invited_email_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Project_Member_invited_email_idx" ON public."Project_Member" USING btree (invited_email);


--
-- Name: Project_Member_project_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Project_Member_project_id_idx" ON public."Project_Member" USING btree (project_id);


--
-- Name: Project_Member_project_id_invited_email_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Project_Member_project_id_invited_email_idx" ON public."Project_Member" USING btree (project_id, invited_email);


--
-- Name: Project_Member_user_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "Project_Member_user_id_idx" ON public."Project_Member" USING btree (user_id);


--
-- Name: System_Log_action_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "System_Log_action_idx" ON public."System_Log" USING btree (action);


--
-- Name: System_Log_created_at_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "System_Log_created_at_idx" ON public."System_Log" USING btree (created_at);


--
-- Name: System_Log_entity_table_entity_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "System_Log_entity_table_entity_id_idx" ON public."System_Log" USING btree (entity_table, entity_id);


--
-- Name: System_Log_user_id_idx; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX "System_Log_user_id_idx" ON public."System_Log" USING btree (user_id);


--
-- Name: idx_article_issue; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_article_issue ON public."Article" USING btree (issue_id);


--
-- Name: idx_article_page; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_article_page ON public."Article" USING btree (created_at DESC, article_id DESC) WHERE (is_deleted = false);


--
-- Name: idx_article_perf; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_article_perf ON public."Article" USING btree (publication_year, is_deleted) INCLUDE (article_id, citation_count, issue_id);


--
-- Name: idx_article_topic; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_article_topic ON public."Article" USING btree (primary_topic);


--
-- Name: idx_author_article_perf; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_author_article_perf ON public."Author_Article" USING btree (article_id, author_id);


--
-- Name: idx_institution_author_institution_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_institution_author_institution_id ON public."Institution_Author" USING btree (institution_id);


--
-- Name: idx_issue_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_issue_active ON public."Issue" USING btree (issue_id, volume_id) WHERE (is_deleted = false);


--
-- Name: idx_issue_volume_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_issue_volume_id ON public."Issue" USING btree (volume_id);


--
-- Name: idx_journal_active_country; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_journal_active_country ON public."Journal" USING btree (country) WHERE (is_deleted = false);


--
-- Name: idx_journal_active_display_name; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_journal_active_display_name ON public."Journal" USING btree (display_name) WHERE (is_deleted = false);


--
-- Name: idx_journal_active_publisher; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_journal_active_publisher ON public."Journal" USING btree (publisher_id) WHERE (is_deleted = false);


--
-- Name: idx_journal_display_name_trgm; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_journal_display_name_trgm ON public."Journal" USING gin (display_name public.gin_trgm_ops);


--
-- Name: idx_journal_ranking_journal_year; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_journal_ranking_journal_year ON public."Journal_Ranking" USING btree (journal_id, year DESC);


--
-- Name: idx_journal_subject_category_category; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_journal_subject_category_category ON public."Journal_Subject_Category" USING btree (subject_category_id);


--
-- Name: idx_journal_subject_category_journal; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_journal_subject_category_journal ON public."Journal_Subject_Category" USING btree (journal_id);


--
-- Name: idx_jrsc_journal_ranking_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_jrsc_journal_ranking_id ON public."Journal_Ranking_Subject_Category" USING btree (journal_ranking_id);


--
-- Name: idx_keyword_article_article_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_keyword_article_article_id ON public."Keyword_Article" USING btree (article_id);


--
-- Name: idx_project_bookmark_article_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_project_bookmark_article_id ON public."Project_Article_Bookmark" USING btree (article_id);


--
-- Name: idx_project_journal_journal_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_project_journal_journal_id ON public."Project_Journal" USING btree (journal_id);


--
-- Name: idx_project_keyword_keyword_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_project_keyword_keyword_id ON public."Project_Keyword" USING btree (keyword_id);


--
-- Name: idx_subject_category_area; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_subject_category_area ON public."Subject_Category" USING btree (subject_area_id);


--
-- Name: idx_topic_id; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_topic_id ON public."Topic" USING btree (topic_id);


--
-- Name: idx_volume_journal_active; Type: INDEX; Schema: public; Owner: admin
--

CREATE INDEX idx_volume_journal_active ON public."Volume" USING btree (journal_id) WHERE (is_deleted = false);


--
-- Name: article_manifest_items article_manifest_items_article_id_fkey; Type: FK CONSTRAINT; Schema: pipeline; Owner: admin
--

ALTER TABLE ONLY pipeline.article_manifest_items
    ADD CONSTRAINT article_manifest_items_article_id_fkey FOREIGN KEY (article_id) REFERENCES public."Article"(article_id) ON DELETE RESTRICT;


--
-- Name: article_manifest_items article_manifest_items_manifest_name_fkey; Type: FK CONSTRAINT; Schema: pipeline; Owner: admin
--

ALTER TABLE ONLY pipeline.article_manifest_items
    ADD CONSTRAINT article_manifest_items_manifest_name_fkey FOREIGN KEY (manifest_name) REFERENCES pipeline.article_manifests(manifest_name) ON DELETE CASCADE;


--
-- Name: article_prune_runs article_prune_runs_manifest_name_fkey; Type: FK CONSTRAINT; Schema: pipeline; Owner: admin
--

ALTER TABLE ONLY pipeline.article_prune_runs
    ADD CONSTRAINT article_prune_runs_manifest_name_fkey FOREIGN KEY (manifest_name) REFERENCES pipeline.article_manifests(manifest_name) ON DELETE RESTRICT;


--
-- Name: Article Article_issue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Article"
    ADD CONSTRAINT "Article_issue_id_fkey" FOREIGN KEY (issue_id) REFERENCES public."Issue"(issue_id) DEFERRABLE;


--
-- Name: Article Article_primary_topic_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Article"
    ADD CONSTRAINT "Article_primary_topic_fkey" FOREIGN KEY (primary_topic) REFERENCES public."Topic"(topic_id) DEFERRABLE;


--
-- Name: Author_Article Author_Article_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Author_Article"
    ADD CONSTRAINT "Author_Article_article_id_fkey" FOREIGN KEY (article_id) REFERENCES public."Article"(article_id) DEFERRABLE;


--
-- Name: Author_Article Author_Article_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Author_Article"
    ADD CONSTRAINT "Author_Article_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public."Author"(author_id) DEFERRABLE;


--
-- Name: Project_Chat_Message FK_Project_Chat_Message_User; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Chat_Message"
    ADD CONSTRAINT "FK_Project_Chat_Message_User" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) ON DELETE SET NULL;


--
-- Name: Institution_Author Institution_Author_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Institution_Author"
    ADD CONSTRAINT "Institution_Author_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public."Author"(author_id) DEFERRABLE;


--
-- Name: Institution_Author Institution_Author_institution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Institution_Author"
    ADD CONSTRAINT "Institution_Author_institution_id_fkey" FOREIGN KEY (institution_id) REFERENCES public."Institution"(institution_id) DEFERRABLE;


--
-- Name: Institution Institution_country_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Institution"
    ADD CONSTRAINT "Institution_country_code_fkey" FOREIGN KEY (country_code) REFERENCES public."Zone"(code) DEFERRABLE;


--
-- Name: Issue Issue_volume_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Issue"
    ADD CONSTRAINT "Issue_volume_id_fkey" FOREIGN KEY (volume_id) REFERENCES public."Volume"(volume_id) DEFERRABLE;


--
-- Name: Journal_Ranking_Subject_Category Journal_Ranking_Subject_Category_journal_ranking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal_Ranking_Subject_Category"
    ADD CONSTRAINT "Journal_Ranking_Subject_Category_journal_ranking_id_fkey" FOREIGN KEY (journal_ranking_id) REFERENCES public."Journal_Ranking"(journal_ranking_id) DEFERRABLE;


--
-- Name: Journal_Ranking_Subject_Category Journal_Ranking_Subject_Category_subject_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal_Ranking_Subject_Category"
    ADD CONSTRAINT "Journal_Ranking_Subject_Category_subject_category_id_fkey" FOREIGN KEY (subject_category_id) REFERENCES public."Subject_Category"(subject_category_id) DEFERRABLE;


--
-- Name: Journal_Ranking Journal_Ranking_journal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal_Ranking"
    ADD CONSTRAINT "Journal_Ranking_journal_id_fkey" FOREIGN KEY (journal_id) REFERENCES public."Journal"(journal_id) DEFERRABLE;


--
-- Name: Journal_Ranking Journal_Ranking_metric_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal_Ranking"
    ADD CONSTRAINT "Journal_Ranking_metric_id_fkey" FOREIGN KEY (metric_id) REFERENCES public."Ranking_Metric"(metric_id) DEFERRABLE;


--
-- Name: Journal_Ranking Journal_Ranking_subject_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal_Ranking"
    ADD CONSTRAINT "Journal_Ranking_subject_category_id_fkey" FOREIGN KEY (subject_category_id) REFERENCES public."Subject_Category"(subject_category_id) DEFERRABLE;


--
-- Name: Journal_Subject_Category Journal_Subject_Category_journal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal_Subject_Category"
    ADD CONSTRAINT "Journal_Subject_Category_journal_id_fkey" FOREIGN KEY (journal_id) REFERENCES public."Journal"(journal_id) DEFERRABLE;


--
-- Name: Journal_Subject_Category Journal_Subject_Category_subject_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal_Subject_Category"
    ADD CONSTRAINT "Journal_Subject_Category_subject_category_id_fkey" FOREIGN KEY (subject_category_id) REFERENCES public."Subject_Category"(subject_category_id) DEFERRABLE;


--
-- Name: Journal Journal_country_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal"
    ADD CONSTRAINT "Journal_country_fkey" FOREIGN KEY (country) REFERENCES public."Zone"(zone_id) DEFERRABLE;


--
-- Name: Journal Journal_publisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal"
    ADD CONSTRAINT "Journal_publisher_id_fkey" FOREIGN KEY (publisher_id) REFERENCES public."Publisher"(publisher_id) DEFERRABLE;


--
-- Name: Journal Journal_region_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Journal"
    ADD CONSTRAINT "Journal_region_fkey" FOREIGN KEY (region) REFERENCES public."Zone"(zone_id) DEFERRABLE;


--
-- Name: Keyword_Article Keyword_Article_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Keyword_Article"
    ADD CONSTRAINT "Keyword_Article_article_id_fkey" FOREIGN KEY (article_id) REFERENCES public."Article"(article_id) DEFERRABLE;


--
-- Name: Keyword_Article Keyword_Article_keyword_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Keyword_Article"
    ADD CONSTRAINT "Keyword_Article_keyword_id_fkey" FOREIGN KEY (keyword_id) REFERENCES public."Keyword"(keyword_id) DEFERRABLE;


--
-- Name: Password_Reset_Token Password_Reset_Token_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Password_Reset_Token"
    ADD CONSTRAINT "Password_Reset_Token_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) DEFERRABLE;


--
-- Name: Project_Article_Bookmark Project_Article_Bookmark_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Article_Bookmark"
    ADD CONSTRAINT "Project_Article_Bookmark_article_id_fkey" FOREIGN KEY (article_id) REFERENCES public."Article"(article_id) DEFERRABLE;


--
-- Name: Project_Article_Bookmark Project_Article_Bookmark_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Article_Bookmark"
    ADD CONSTRAINT "Project_Article_Bookmark_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public."Project"(project_id) DEFERRABLE;


--
-- Name: Project_Article_Bookmark Project_Article_Bookmark_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Article_Bookmark"
    ADD CONSTRAINT "Project_Article_Bookmark_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) DEFERRABLE;


--
-- Name: Project_Chat_Message Project_Chat_Message_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Chat_Message"
    ADD CONSTRAINT "Project_Chat_Message_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public."Project"(project_id) DEFERRABLE;


--
-- Name: Project_Journal Project_Journal_journal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Journal"
    ADD CONSTRAINT "Project_Journal_journal_id_fkey" FOREIGN KEY (journal_id) REFERENCES public."Journal"(journal_id) DEFERRABLE;


--
-- Name: Project_Journal Project_Journal_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Journal"
    ADD CONSTRAINT "Project_Journal_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public."Project"(project_id) DEFERRABLE;


--
-- Name: Project_Keyword Project_Keyword_keyword_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Keyword"
    ADD CONSTRAINT "Project_Keyword_keyword_id_fkey" FOREIGN KEY (keyword_id) REFERENCES public."Keyword"(keyword_id) DEFERRABLE;


--
-- Name: Project_Keyword Project_Keyword_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Keyword"
    ADD CONSTRAINT "Project_Keyword_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public."Project"(project_id) DEFERRABLE;


--
-- Name: Project_Member Project_Member_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Member"
    ADD CONSTRAINT "Project_Member_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES public."user"(user_id) DEFERRABLE;


--
-- Name: Project_Member Project_Member_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Member"
    ADD CONSTRAINT "Project_Member_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public."Project"(project_id) DEFERRABLE;


--
-- Name: Project_Member Project_Member_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project_Member"
    ADD CONSTRAINT "Project_Member_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) DEFERRABLE;


--
-- Name: Project Project_subject_area_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_subject_area_fkey" FOREIGN KEY (subject_area) REFERENCES public."Subject_Area"(subject_area_id) DEFERRABLE;


--
-- Name: Project Project_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) DEFERRABLE;


--
-- Name: Sub_Topic Sub_Topic_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Sub_Topic"
    ADD CONSTRAINT "Sub_Topic_article_id_fkey" FOREIGN KEY (article_id) REFERENCES public."Article"(article_id) DEFERRABLE;


--
-- Name: Sub_Topic Sub_Topic_topic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Sub_Topic"
    ADD CONSTRAINT "Sub_Topic_topic_id_fkey" FOREIGN KEY (topic_id) REFERENCES public."Topic"(topic_id) DEFERRABLE;


--
-- Name: Subject_Category_Project Subject_Category_Project_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Subject_Category_Project"
    ADD CONSTRAINT "Subject_Category_Project_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public."Project"(project_id) DEFERRABLE;


--
-- Name: Subject_Category_Project Subject_Category_Project_subject_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Subject_Category_Project"
    ADD CONSTRAINT "Subject_Category_Project_subject_category_id_fkey" FOREIGN KEY (subject_category_id) REFERENCES public."Subject_Category"(subject_category_id) DEFERRABLE;


--
-- Name: Subject_Category Subject_Category_subject_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Subject_Category"
    ADD CONSTRAINT "Subject_Category_subject_area_id_fkey" FOREIGN KEY (subject_area_id) REFERENCES public."Subject_Area"(subject_area_id) DEFERRABLE;


--
-- Name: System_Log System_Log_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."System_Log"
    ADD CONSTRAINT "System_Log_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."user"(user_id) DEFERRABLE;


--
-- Name: Topic Topic_subject_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Topic"
    ADD CONSTRAINT "Topic_subject_area_id_fkey" FOREIGN KEY (subject_area_id) REFERENCES public."Subject_Area"(subject_area_id) DEFERRABLE;


--
-- Name: Topic Topic_subject_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Topic"
    ADD CONSTRAINT "Topic_subject_category_id_fkey" FOREIGN KEY (subject_category_id) REFERENCES public."Subject_Category"(subject_category_id) DEFERRABLE;


--
-- Name: Volume Volume_journal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Volume"
    ADD CONSTRAINT "Volume_journal_id_fkey" FOREIGN KEY (journal_id) REFERENCES public."Journal"(journal_id) DEFERRABLE;


--
-- Name: payment_transaction payment_transaction_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_transaction
    ADD CONSTRAINT payment_transaction_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.coin_package(package_id) DEFERRABLE;


--
-- Name: payment_transaction payment_transaction_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.payment_transaction
    ADD CONSTRAINT payment_transaction_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) DEFERRABLE;


--
-- Name: wallet_transaction wallet_transaction_payment_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wallet_transaction
    ADD CONSTRAINT wallet_transaction_payment_transaction_id_fkey FOREIGN KEY (payment_transaction_id) REFERENCES public.payment_transaction(transaction_id) DEFERRABLE;


--
-- Name: wallet_transaction wallet_transaction_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wallet_transaction
    ADD CONSTRAINT wallet_transaction_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) DEFERRABLE;


--
-- Name: wallet_transaction wallet_transaction_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wallet_transaction
    ADD CONSTRAINT wallet_transaction_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.wallet(wallet_id) DEFERRABLE;


--
-- Name: wallet wallet_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.wallet
    ADD CONSTRAINT wallet_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(user_id) DEFERRABLE;


--
-- PostgreSQL database dump complete
--

\unrestrict ePIJOMdBQUOZEoUuKeJ64K33num8gkAViGkhktotpvmhtxBABwuPGrY2bY6gMVx

