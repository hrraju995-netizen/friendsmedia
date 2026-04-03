import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/community";
import {
  DEFAULT_MEDIA_CATEGORIES,
  MEDIA_CATEGORIES_CONFIG_KEY,
  normalizeMediaCategoryName,
  parseMediaCategoriesValue,
  serializeMediaCategoriesValue,
} from "@/lib/media-categories";
import { prisma } from "@/lib/prisma";

async function requireSuperAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return isSuperAdmin(user?.role);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await requireSuperAdmin(session.user.id))) {
    return NextResponse.json({ error: "Only the main admin can manage categories." }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string };
  const nextCategory = normalizeMediaCategoryName(body.name || "");

  if (nextCategory.length < 2 || nextCategory.length > 40) {
    return NextResponse.json({ error: "Category name must be between 2 and 40 characters." }, { status: 400 });
  }

  const existingConfig = await prisma.appConfig.findUnique({
    where: { key: MEDIA_CATEGORIES_CONFIG_KEY },
  });

  const categories = parseMediaCategoriesValue(existingConfig?.value);

  if (categories.some((category) => category.toLowerCase() === nextCategory.toLowerCase())) {
    return NextResponse.json({ error: "This category already exists." }, { status: 409 });
  }

  const updatedCategories = [...categories, nextCategory];

  await prisma.appConfig.upsert({
    where: { key: MEDIA_CATEGORIES_CONFIG_KEY },
    update: { value: serializeMediaCategoriesValue(updatedCategories) },
    create: {
      key: MEDIA_CATEGORIES_CONFIG_KEY,
      value: serializeMediaCategoriesValue(updatedCategories),
    },
  });

  return NextResponse.json({ message: "Category added.", categories: updatedCategories }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await requireSuperAdmin(session.user.id))) {
    return NextResponse.json({ error: "Only the main admin can manage categories." }, { status: 403 });
  }

  const body = (await request.json()) as { name?: string };
  const categoryToRemove = normalizeMediaCategoryName(body.name || "");

  if (!categoryToRemove) {
    return NextResponse.json({ error: "Category name is required." }, { status: 400 });
  }

  const existingConfig = await prisma.appConfig.findUnique({
    where: { key: MEDIA_CATEGORIES_CONFIG_KEY },
  });

  const categories = parseMediaCategoriesValue(existingConfig?.value);
  const nextCategories = categories.filter((category) => category.toLowerCase() !== categoryToRemove.toLowerCase());

  if (nextCategories.length === categories.length) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  if (nextCategories.length === 0) {
    return NextResponse.json({ error: "Keep at least one category." }, { status: 400 });
  }

  const mediaUsingCategory = await prisma.media.count({
    where: {
      category: categoryToRemove,
      deletedAt: null,
    },
  });

  if (mediaUsingCategory > 0) {
    return NextResponse.json({ error: "This category is already used by uploaded media." }, { status: 409 });
  }

  const finalCategories = nextCategories.length > 0 ? nextCategories : [...DEFAULT_MEDIA_CATEGORIES];

  await prisma.appConfig.upsert({
    where: { key: MEDIA_CATEGORIES_CONFIG_KEY },
    update: { value: serializeMediaCategoriesValue(finalCategories) },
    create: {
      key: MEDIA_CATEGORIES_CONFIG_KEY,
      value: serializeMediaCategoriesValue(finalCategories),
    },
  });

  return NextResponse.json({ message: "Category removed.", categories: finalCategories });
}
