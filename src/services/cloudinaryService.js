const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim() || "dw79lzd2n";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET?.trim() || "ml_default";

export const TOPIC_PDF_MAX_SIZE = 10 * 1024 * 1024;
export const EVENT_BANNER_MAX_SIZE = 5 * 1024 * 1024;

export function validateTopicPdf(file) {
  if (!file) return "";

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) return "Chỉ được tải lên file PDF.";
  if (file.size > TOPIC_PDF_MAX_SIZE) {
    return "File PDF không được vượt quá 10MB.";
  }

  return "";
}

export function uploadTopicPdf(file, { onProgress } = {}) {
  const validationError = validateTopicPdf(file);
  if (validationError) return Promise.reject(new Error(validationError));

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    return Promise.reject(
      new Error("Thiếu cấu hình Cloudinary. Kiểm tra VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.")
    );
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Cloudinary trả về dữ liệu không hợp lệ."));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
        resolve(data);
        return;
      }

      reject(
        new Error(
          data?.error?.message || "Không thể tải file PDF lên Cloudinary."
        )
      );
    };

    xhr.onerror = () => reject(new Error("Không thể kết nối Cloudinary."));
    xhr.open("POST", endpoint);
    xhr.send(formData);
  });
}

export function validateEventBannerImage(file) {
  if (!file) return "";

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const allowedExtension = /\.(jpe?g|png|webp|gif)$/i.test(file.name);

  if (!allowedTypes.includes(file.type) && !allowedExtension) {
    return "Chỉ được tải lên ảnh JPG, PNG, WEBP hoặc GIF.";
  }

  if (file.size > EVENT_BANNER_MAX_SIZE) {
    return "Ảnh banner không được vượt quá 5MB.";
  }

  return "";
}

export function uploadEventBannerImage(file, { onProgress } = {}) {
  const validationError = validateEventBannerImage(file);
  if (validationError) return Promise.reject(new Error(validationError));

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    return Promise.reject(
      new Error(
        "Thiếu cấu hình Cloudinary. Kiểm tra VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.",
      ),
    );
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error("Cloudinary trả về dữ liệu không hợp lệ."));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
        resolve(data);
        return;
      }

      reject(
        new Error(
          data?.error?.message || "Không thể tải ảnh banner lên Cloudinary.",
        ),
      );
    };

    xhr.onerror = () => reject(new Error("Không thể kết nối Cloudinary."));
    xhr.open("POST", endpoint);
    xhr.send(formData);
  });
}
