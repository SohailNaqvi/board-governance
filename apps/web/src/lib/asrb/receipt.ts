import prisma from "../prisma";

export async function generateReceiptReference(): Promise<string> {
  // Format: ASRB-YYYY-MM-NNNNNN
  // YYYY = year, MM = month, NNNNNN = zero-padded sequential number

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const yearMonth = `${year}-${month}`;

  // Query the database for the last receipt in the current month
  const lastCase = await prisma.aSRBCase.findFirst({
    where: {
      receiptReference: {
        startsWith: `ASRB-${yearMonth}-`,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  let sequenceNumber = 1;

  if (lastCase) {
    // Extract the sequence number from the last receipt
    const match = lastCase.receiptReference.match(/ASRB-\d{4}-\d{2}-(\d{6})$/);
    if (match) {
      sequenceNumber = parseInt(match[1], 10) + 1;
    }
  }

  const paddedSequence = String(sequenceNumber).padStart(6, "0");
  return `ASRB-${yearMonth}-${paddedSequence}`;
}
