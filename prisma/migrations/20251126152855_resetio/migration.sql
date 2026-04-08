-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deities" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "titolopatrono" TEXT NOT NULL,
    "tipopatrono" VARCHAR(255) NOT NULL,
    "gradopatrono" VARCHAR(255) NOT NULL,
    "card" VARCHAR(255) NOT NULL,
    "astri" VARCHAR(255) NOT NULL,
    "elemento" VARCHAR(255) NOT NULL,
    "classe" VARCHAR(255) NOT NULL,
    "festivita" VARCHAR(255) NOT NULL,
    "colore" INTEGER NOT NULL,
    "tradizione" VARCHAR(255) NOT NULL,
    "allineamento" INTEGER NOT NULL,
    "dominioallineamento" INTEGER NOT NULL,
    "residenza" VARCHAR(255) NOT NULL,
    "luogo" INTEGER NOT NULL,
    "significato" TEXT NOT NULL,

    CONSTRAINT "deities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" VARCHAR(255) NOT NULL,
    "date" DATE NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "magicitems" (
    "id" SERIAL NOT NULL,
    "descrizione" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "rarita" INTEGER NOT NULL,
    "tipo" INTEGER NOT NULL,
    "sintonia" BOOLEAN,

    CONSTRAINT "magicitems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "png" (
    "id" SERIAL NOT NULL,
    "descrizione" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "titolo" VARCHAR(255),
    "allineamento" INTEGER NOT NULL,
    "dominioallineamento" INTEGER NOT NULL,
    "mansione" VARCHAR(255),
    "luogo" INTEGER NOT NULL,
    "fazione" INTEGER NOT NULL,
    "aspetto" TEXT,
    "personalita" TEXT,
    "motivazioni" TEXT,
    "segreti" TEXT,

    CONSTRAINT "png_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue" (
    "month" VARCHAR(4) NOT NULL,
    "revenue" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "spells" (
    "id" SERIAL NOT NULL,
    "descrizione" TEXT NOT NULL,
    "livello" INTEGER NOT NULL,
    "circolo" INTEGER[],
    "classi" INTEGER[],
    "sottoclassi" INTEGER[],
    "tempodilancio" TEXT NOT NULL,
    "gittata" TEXT NOT NULL,
    "componenti" TEXT NOT NULL,
    "durata" TEXT NOT NULL,
    "tirosalvezza" VARCHAR(255),
    "rituale" BOOLEAN,
    "intensificato" TEXT,
    "concentrazione" BOOLEAN,

    CONSTRAINT "spells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revenue_month_key" ON "revenue"("month");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
