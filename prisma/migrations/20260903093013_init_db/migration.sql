-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "auth_provider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "log_action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'IMPORT', 'ERROR', 'SYSTEM', 'ACTIVATE');

-- CreateEnum
CREATE TYPE "log_level" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "log_source" AS ENUM ('API', 'ADMIN_PANEL', 'SYSTEM', 'CRON');

-- CreateEnum
CREATE TYPE "message_role" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "message_status" AS ENUM ('PENDING', 'COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('vnpay', 'momo', 'bank_transfer', 'stripe', 'paypal');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'success', 'failed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "project_member_role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "project_member_status" AS ENUM ('INVITED', 'ACCEPTED', 'REJECTED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ranking_metric_type" AS ENUM ('QUARTILE', 'SCORE', 'INTEGER');

-- CreateEnum
CREATE TYPE "ranking_source" AS ENUM ('SCOPUS', 'WOS', 'SCIMAGO');

-- CreateEnum
CREATE TYPE "role_account" AS ENUM ('STUDENT', 'LECTURER', 'RESEARCHER', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "source_zone" AS ENUM ('ISO', 'SCIMAGO', 'OPENALEX', 'INTERNAL');

-- CreateEnum
CREATE TYPE "status_account" AS ENUM ('INACTIVE', 'ACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "type_zone" AS ENUM ('COUNTRY', 'REGION');

-- CreateEnum
CREATE TYPE "wallet_transaction_type" AS ENUM ('deposit', 'spend', 'refund', 'admin_adjust');

-- CreateTable
CREATE TABLE "Article" (
    "article_id" BIGSERIAL NOT NULL,
    "version" VARCHAR,
    "issue_id" BIGINT,
    "title" VARCHAR NOT NULL,
    "abstract" VARCHAR,
    "publication_year" INTEGER,
    "doi" VARCHAR,
    "primary_topic" BIGINT,
    "semantic_scholar_id" VARCHAR,
    "citation_count" BIGINT,
    "semantic_influential_citation_count" BIGINT,
    "semantic_external_ids" JSONB,
    "semantic_tldr" VARCHAR,
    "references" JSONB,
    "reference_count" BIGINT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN DEFAULT false,
    "embedding" vector,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("article_id")
);

-- CreateTable
CREATE TABLE "Author" (
    "author_id" BIGSERIAL NOT NULL,
    "orcid" VARCHAR,
    "display_name" VARCHAR,
    "url_image" VARCHAR,
    "openalex_id" VARCHAR,
    "works_count" BIGINT,
    "cited_by_count" BIGINT,
    "h_index" BIGINT,
    "i10_index" BIGINT,
    "last_known_institution" VARCHAR,
    "last_known_institution_id" VARCHAR,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("author_id")
);

-- CreateTable
CREATE TABLE "Author_Article" (
    "author_id" BIGINT NOT NULL,
    "article_id" BIGINT NOT NULL,

    CONSTRAINT "Author_Article_pkey" PRIMARY KEY ("author_id","article_id")
);

-- CreateTable
CREATE TABLE "Institution" (
    "institution_id" BIGSERIAL NOT NULL,
    "openalex_id" VARCHAR,
    "display_name" VARCHAR NOT NULL,
    "country_code" VARCHAR,
    "type" VARCHAR,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("institution_id")
);

-- CreateTable
CREATE TABLE "Institution_Author" (
    "author_id" BIGINT NOT NULL,
    "institution_id" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "Institution_Author_pkey" PRIMARY KEY ("author_id","institution_id","year")
);

-- CreateTable
CREATE TABLE "Issue" (
    "issue_id" BIGSERIAL NOT NULL,
    "volume_id" BIGINT,
    "issue_number" VARCHAR,
    "publication_year" INTEGER,
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("issue_id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "journal_id" BIGSERIAL NOT NULL,
    "source_id" VARCHAR,
    "publisher_id" BIGINT,
    "country" BIGINT,
    "region" BIGINT,
    "display_name" VARCHAR NOT NULL,
    "type" VARCHAR,
    "is_open_access" BOOLEAN,
    "is_oa_diamond" BOOLEAN,
    "coverage" VARCHAR,
    "issn" VARCHAR,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("journal_id")
);

-- CreateTable
CREATE TABLE "Journal_Ranking" (
    "journal_ranking_id" BIGSERIAL NOT NULL,
    "journal_id" BIGINT NOT NULL,
    "subject_category_id" BIGINT,
    "metric_id" BIGINT NOT NULL,
    "year" INTEGER NOT NULL,
    "value_txt" VARCHAR,
    "value_int" INTEGER,
    "value_float" DOUBLE PRECISION,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Journal_Ranking_pkey" PRIMARY KEY ("journal_ranking_id")
);

-- CreateTable
CREATE TABLE "Journal_Ranking_Subject_Category" (
    "journal_ranking_id" BIGINT NOT NULL,
    "subject_category_id" BIGINT NOT NULL,

    CONSTRAINT "Journal_Ranking_Subject_Category_pkey" PRIMARY KEY ("journal_ranking_id","subject_category_id")
);

-- CreateTable
CREATE TABLE "Journal_Subject_Category" (
    "journal_id" BIGINT NOT NULL,
    "subject_category_id" BIGINT NOT NULL,

    CONSTRAINT "Journal_Subject_Category_pkey" PRIMARY KEY ("journal_id","subject_category_id")
);

-- CreateTable
CREATE TABLE "Keyword" (
    "keyword_id" BIGSERIAL NOT NULL,
    "display_name" VARCHAR,

    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("keyword_id")
);

-- CreateTable
CREATE TABLE "Keyword_Article" (
    "keyword_id" BIGINT NOT NULL,
    "article_id" BIGINT NOT NULL,
    "score" DOUBLE PRECISION,

    CONSTRAINT "Keyword_Article_pkey" PRIMARY KEY ("keyword_id","article_id")
);

-- CreateTable
CREATE TABLE "Password_Reset_Token" (
    "token_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "used_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Password_Reset_Token_pkey" PRIMARY KEY ("token_id")
);

-- CreateTable
CREATE TABLE "Project" (
    "project_id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "subject_area" BIGINT,
    "title" VARCHAR,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) DEFAULT 'INACTIVE',

    CONSTRAINT "Project_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "Project_Article_Bookmark" (
    "project_id" BIGINT NOT NULL,
    "article_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_Project_Article_Bookmark" PRIMARY KEY ("project_id","article_id","user_id")
);

-- CreateTable
CREATE TABLE "Project_Chat_Message" (
    "message_id" BIGSERIAL NOT NULL,
    "project_id" BIGINT NOT NULL,
    "role" "message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "model" VARCHAR(100),
    "prompt_tokens" INTEGER DEFAULT 0,
    "completion_tokens" INTEGER DEFAULT 0,
    "total_tokens" INTEGER DEFAULT 0,
    "latency_ms" INTEGER,
    "status" "message_status" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,

    CONSTRAINT "Project_Chat_Message_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "Project_Journal" (
    "project_id" BIGINT NOT NULL,
    "journal_id" BIGINT NOT NULL,

    CONSTRAINT "Project_Journal_pkey" PRIMARY KEY ("project_id","journal_id")
);

-- CreateTable
CREATE TABLE "Project_Keyword" (
    "project_id" BIGINT NOT NULL,
    "keyword_id" BIGINT NOT NULL,

    CONSTRAINT "Project_Keyword_pkey" PRIMARY KEY ("project_id","keyword_id")
);

-- CreateTable
CREATE TABLE "Project_Member" (
    "project_member_id" BIGSERIAL NOT NULL,
    "project_id" BIGINT NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "project_member_role" NOT NULL DEFAULT 'MEMBER',
    "status" "project_member_status" NOT NULL DEFAULT 'INVITED',
    "invited_by" UUID NOT NULL,
    "invited_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(6),
    "removed_at" TIMESTAMP(6),

    CONSTRAINT "Project_Member_pkey" PRIMARY KEY ("project_member_id")
);

-- CreateTable
CREATE TABLE "Publisher" (
    "publisher_id" BIGSERIAL NOT NULL,
    "display_name" VARCHAR,
    "image_url" VARCHAR,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Publisher_pkey" PRIMARY KEY ("publisher_id")
);

-- CreateTable
CREATE TABLE "Ranking_Metric" (
    "metric_id" BIGSERIAL NOT NULL,
    "code" VARCHAR,
    "display_name" VARCHAR,
    "metric_type" "ranking_metric_type",
    "description" VARCHAR,

    CONSTRAINT "Ranking_Metric_pkey" PRIMARY KEY ("metric_id")
);

-- CreateTable
CREATE TABLE "Sub_Topic" (
    "article_id" BIGINT NOT NULL,
    "topic_id" BIGINT NOT NULL,

    CONSTRAINT "Sub_Topic_pkey" PRIMARY KEY ("article_id","topic_id")
);

-- CreateTable
CREATE TABLE "Subject_Area" (
    "subject_area_id" BIGSERIAL NOT NULL,
    "display_name" VARCHAR,
    "description" VARCHAR,
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "Subject_Area_pkey" PRIMARY KEY ("subject_area_id")
);

-- CreateTable
CREATE TABLE "Subject_Category" (
    "subject_category_id" BIGSERIAL NOT NULL,
    "subject_area_id" BIGINT,
    "display_name" VARCHAR,
    "description" VARCHAR,
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "Subject_Category_pkey" PRIMARY KEY ("subject_category_id")
);

-- CreateTable
CREATE TABLE "Subject_Category_Project" (
    "project_id" BIGINT NOT NULL,
    "subject_category_id" BIGINT NOT NULL,

    CONSTRAINT "Subject_Category_Project_pkey" PRIMARY KEY ("project_id","subject_category_id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "topic_id" BIGSERIAL NOT NULL,
    "display_name" VARCHAR,
    "score" DOUBLE PRECISION,
    "subject_area_id" BIGINT,
    "subject_category_id" BIGINT,
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("topic_id")
);

-- CreateTable
CREATE TABLE "Volume" (
    "volume_id" BIGSERIAL NOT NULL,
    "journal_id" BIGINT,
    "volume_number" INTEGER,
    "publication_year" INTEGER,
    "is_deleted" BOOLEAN DEFAULT false,

    CONSTRAINT "Volume_pkey" PRIMARY KEY ("volume_id")
);

-- CreateTable
CREATE TABLE "Zone" (
    "zone_id" BIGSERIAL NOT NULL,
    "code" VARCHAR,
    "name" VARCHAR,
    "type" "type_zone",
    "iso_code" VARCHAR,
    "source" "source_zone",
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("zone_id")
);

-- CreateTable
CREATE TABLE "coin_package" (
    "package_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "coin_amount" BIGINT NOT NULL,
    "bonus_coin" BIGINT NOT NULL DEFAULT 0,
    "price" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_package_pkey" PRIMARY KEY ("package_id")
);

-- CreateTable
CREATE TABLE "payment_transaction" (
    "transaction_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "package_id" UUID,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND',
    "coin_amount" BIGINT NOT NULL,
    "bonus_coin" BIGINT NOT NULL DEFAULT 0,
    "total_coin" BIGINT NOT NULL,
    "payment_method" "payment_method" NOT NULL,
    "payment_status" "payment_status" NOT NULL DEFAULT 'pending',
    "provider_transaction_code" VARCHAR(255),
    "note" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(6),

    CONSTRAINT "payment_transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "system_log" (
    "log_id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "user_role" "role_account",
    "action" "log_action" NOT NULL,
    "level" "log_level" NOT NULL DEFAULT 'INFO',
    "source" "log_source" NOT NULL DEFAULT 'API',
    "entity_table" VARCHAR(100),
    "entity_id" VARCHAR(64),
    "message" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "user" (
    "user_id" UUID NOT NULL,
    "email" VARCHAR NOT NULL,
    "password" VARCHAR,
    "type" "auth_provider",
    "status" "status_account",
    "role" "role_account",
    "last_name" VARCHAR,
    "first_name" VARCHAR,
    "url_image" VARCHAR,
    "date_of_birth" DATE,
    "gender" BOOLEAN,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "wallet" (
    "wallet_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "total_deposit" BIGINT NOT NULL DEFAULT 0,
    "total_spent" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("wallet_id")
);

-- CreateTable
CREATE TABLE "wallet_transaction" (
    "wallet_transaction_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wallet_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" "wallet_transaction_type" NOT NULL,
    "amount" BIGINT NOT NULL,
    "balance_before" BIGINT NOT NULL,
    "balance_after" BIGINT NOT NULL,
    "payment_transaction_id" UUID,
    "description" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transaction_pkey" PRIMARY KEY ("wallet_transaction_id")
);

-- CreateIndex
CREATE INDEX "idx_article_title_trgm" ON "Article" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_article_abstract_trgm" ON "Article" USING GIN ("abstract" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_article_pub_year" ON "Article"("publication_year");

-- CreateIndex
CREATE UNIQUE INDEX "Author_orcid_key" ON "Author"("orcid");

-- CreateIndex
CREATE UNIQUE INDEX "Author_openalex_id_key" ON "Author"("openalex_id");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_openalex_id_key" ON "Institution"("openalex_id");

-- CreateIndex
CREATE INDEX "idx_institution_country_type" ON "Institution"("country_code", "type");

-- CreateIndex
CREATE INDEX "idx_institution_author_institution" ON "Institution_Author"("institution_id");

-- CreateIndex
CREATE INDEX "idx_institution_author_year" ON "Institution_Author"("year");

-- CreateIndex
CREATE INDEX "idx_journal_name_trgm" ON "Journal" USING GIN ("display_name" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "Keyword_display_name_key" ON "Keyword"("display_name");

-- CreateIndex
CREATE INDEX "idx_prt_token_hash" ON "Password_Reset_Token"("token_hash");

-- CreateIndex
CREATE INDEX "idx_prt_user_id" ON "Password_Reset_Token"("user_id");

-- CreateIndex
CREATE INDEX "idx_project_chat_message_project_created" ON "Project_Chat_Message"("project_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_pm_project" ON "Project_Member"("project_id");

-- CreateIndex
CREATE INDEX "idx_pm_status" ON "Project_Member"("status");

-- CreateIndex
CREATE INDEX "idx_pm_user" ON "Project_Member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_project_member" ON "Project_Member"("project_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_publisher_display_name" ON "Publisher"("display_name");

-- CreateIndex
CREATE UNIQUE INDEX "Ranking_Metric_code_key" ON "Ranking_Metric"("code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_subject_area_name" ON "Subject_Area"("display_name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_subject_category_area_name" ON "Subject_Category"("subject_area_id", "display_name");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_display_name_key" ON "Topic"("display_name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_zone_name_type" ON "Zone"("name", "type");

-- CreateIndex
CREATE INDEX "idx_payment_status" ON "payment_transaction"("payment_status");

-- CreateIndex
CREATE INDEX "idx_payment_user" ON "payment_transaction"("user_id");

-- CreateIndex
CREATE INDEX "idx_system_log_action" ON "system_log"("action");

-- CreateIndex
CREATE INDEX "idx_system_log_created_at" ON "system_log"("created_at");

-- CreateIndex
CREATE INDEX "idx_system_log_entity" ON "system_log"("entity_table", "entity_id");

-- CreateIndex
CREATE INDEX "idx_system_log_user_id" ON "system_log"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_user_id_key" ON "wallet"("user_id");

-- CreateIndex
CREATE INDEX "idx_wallet_user" ON "wallet"("user_id");

-- CreateIndex
CREATE INDEX "idx_wallet_transaction_created" ON "wallet_transaction"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_wallet_transaction_user" ON "wallet_transaction"("user_id");

-- CreateIndex
CREATE INDEX "idx_wallet_transaction_wallet" ON "wallet_transaction"("wallet_id");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "Issue"("issue_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_primary_topic_fkey" FOREIGN KEY ("primary_topic") REFERENCES "Topic"("topic_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Author_Article" ADD CONSTRAINT "Author_Article_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "Article"("article_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Author_Article" ADD CONSTRAINT "Author_Article_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "Author"("author_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Institution_Author" ADD CONSTRAINT "fk_institution_author_author" FOREIGN KEY ("author_id") REFERENCES "Author"("author_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Institution_Author" ADD CONSTRAINT "fk_institution_author_institution" FOREIGN KEY ("institution_id") REFERENCES "Institution"("institution_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_volume_id_fkey" FOREIGN KEY ("volume_id") REFERENCES "Volume"("volume_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_country_fkey" FOREIGN KEY ("country") REFERENCES "Zone"("zone_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "Publisher"("publisher_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_region_fkey" FOREIGN KEY ("region") REFERENCES "Zone"("zone_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Journal_Ranking" ADD CONSTRAINT "Journal_Ranking_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "Journal"("journal_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Journal_Ranking" ADD CONSTRAINT "Journal_Ranking_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "Ranking_Metric"("metric_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Journal_Ranking" ADD CONSTRAINT "Journal_Ranking_subject_category_id_fkey" FOREIGN KEY ("subject_category_id") REFERENCES "Subject_Category"("subject_category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Journal_Ranking_Subject_Category" ADD CONSTRAINT "Journal_Ranking_Subject_Category_journal_ranking_id_fkey" FOREIGN KEY ("journal_ranking_id") REFERENCES "Journal_Ranking"("journal_ranking_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Journal_Ranking_Subject_Category" ADD CONSTRAINT "Journal_Ranking_Subject_Category_subject_category_id_fkey" FOREIGN KEY ("subject_category_id") REFERENCES "Subject_Category"("subject_category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Journal_Subject_Category" ADD CONSTRAINT "Journal_Subject_Category_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "Journal"("journal_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Journal_Subject_Category" ADD CONSTRAINT "Journal_Subject_Category_subject_category_id_fkey" FOREIGN KEY ("subject_category_id") REFERENCES "Subject_Category"("subject_category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Keyword_Article" ADD CONSTRAINT "Keyword_Article_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "Article"("article_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Keyword_Article" ADD CONSTRAINT "Keyword_Article_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "Keyword"("keyword_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Password_Reset_Token" ADD CONSTRAINT "Password_Reset_Token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_subject_area_fkey" FOREIGN KEY ("subject_area") REFERENCES "Subject_Area"("subject_area_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Article_Bookmark" ADD CONSTRAINT "FK_Project_Article_Article" FOREIGN KEY ("article_id") REFERENCES "Article"("article_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Article_Bookmark" ADD CONSTRAINT "FK_Project_Article_Project" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Article_Bookmark" ADD CONSTRAINT "FK_Project_Article_User" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Chat_Message" ADD CONSTRAINT "fk_project_chat_message_project" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Chat_Message" ADD CONSTRAINT "fk_project_chat_message_user" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Journal" ADD CONSTRAINT "Project_Journal_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "Journal"("journal_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Journal" ADD CONSTRAINT "Project_Journal_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Keyword" ADD CONSTRAINT "Project_Keyword_keyword_id_fkey" FOREIGN KEY ("keyword_id") REFERENCES "Keyword"("keyword_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Keyword" ADD CONSTRAINT "Project_Keyword_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Member" ADD CONSTRAINT "fk_pm_invited_by" FOREIGN KEY ("invited_by") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Member" ADD CONSTRAINT "fk_pm_project" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Project_Member" ADD CONSTRAINT "fk_pm_user" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Sub_Topic" ADD CONSTRAINT "Sub_Topic_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "Article"("article_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Sub_Topic" ADD CONSTRAINT "Sub_Topic_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("topic_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Subject_Category" ADD CONSTRAINT "Subject_Category_subject_area_id_fkey" FOREIGN KEY ("subject_area_id") REFERENCES "Subject_Area"("subject_area_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Subject_Category_Project" ADD CONSTRAINT "Subject_Category_Project_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("project_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Subject_Category_Project" ADD CONSTRAINT "Subject_Category_Project_subject_category_id_fkey" FOREIGN KEY ("subject_category_id") REFERENCES "Subject_Category"("subject_category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subject_area_id_fkey" FOREIGN KEY ("subject_area_id") REFERENCES "Subject_Area"("subject_area_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subject_category_id_fkey" FOREIGN KEY ("subject_category_id") REFERENCES "Subject_Category"("subject_category_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Volume" ADD CONSTRAINT "Volume_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "Journal"("journal_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_transaction" ADD CONSTRAINT "fk_payment_package" FOREIGN KEY ("package_id") REFERENCES "coin_package"("package_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_transaction" ADD CONSTRAINT "fk_payment_user" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "system_log" ADD CONSTRAINT "fk_system_log_user" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "fk_wallet_user" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallet_transaction" ADD CONSTRAINT "fk_wallet_transaction_payment" FOREIGN KEY ("payment_transaction_id") REFERENCES "payment_transaction"("transaction_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallet_transaction" ADD CONSTRAINT "fk_wallet_transaction_user" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallet_transaction" ADD CONSTRAINT "fk_wallet_transaction_wallet" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("wallet_id") ON DELETE CASCADE ON UPDATE NO ACTION;
