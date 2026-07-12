import { BASE_URL } from './apiClient';

export const requestReveal = async (
  roomId: number,
  userId: number,
  token: string,
) => {
  const response = await fetch(
    `${BASE_URL}/Reveal/${roomId}/${userId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
};

export const getRevealIdentity = async (
  roomId: number,
  userId: number,
  token: string,
) => {
  const response = await fetch(
    `${BASE_URL}/Reveal/${roomId}/identity/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
};
