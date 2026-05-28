import prisma from './prisma'

export async function setVerificationData(email, data) {
  await prisma.verificationToken.upsert({
    where: { email },
    update: {
      code: data.code,
      companyName: data.companyName,
      password: data.password,
      expiresAt: new Date(data.expiresAt)
    },
    create: {
      email,
      code: data.code,
      companyName: data.companyName,
      password: data.password,
      expiresAt: new Date(data.expiresAt)
    }
  })
}

export async function getVerificationData(email) {
  const token = await prisma.verificationToken.findUnique({
    where: { email }
  })
  if (!token) return null
  return {
    code: token.code,
    companyName: token.companyName,
    password: token.password,
    expiresAt: token.expiresAt.getTime()
  }
}

export async function deleteVerificationData(email) {
  try {
    await prisma.verificationToken.delete({
      where: { email }
    })
  } catch (error) {
    // Ignore error if not found
  }
}