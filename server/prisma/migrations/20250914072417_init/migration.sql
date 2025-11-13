-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "passwordHash" TEXT NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    "freeDishProgress" INTEGER NOT NULL DEFAULT 0,
    "invitedById" TEXT,
    "friendsInvited" INTEGER NOT NULL DEFAULT 0,
    "friendsVisited" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Visit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardUsed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "achievedAt" TIMESTAMP(3),

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FreeDishReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visitId" TEXT,
    "dishName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FreeDishReward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FreeDishReward_visitId_key" ON "public"."FreeDishReward"("visitId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Visit" ADD CONSTRAINT "Visit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreeDishReward" ADD CONSTRAINT "FreeDishReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FreeDishReward" ADD CONSTRAINT "FreeDishReward_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "public"."Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
