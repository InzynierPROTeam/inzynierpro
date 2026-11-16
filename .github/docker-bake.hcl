variable "RELEASE_SHA" {
  default = "development"
}

variable "OUTPUT_DIR" {
  default = "/tmp/inzpro-images"
}

group "default" {
  targets = ["api", "worker"]
}

target "common" {
  context    = "."
  dockerfile = "apps/api/Dockerfile"
  platforms  = ["linux/amd64"]
  args       = { RELEASE_SHA = RELEASE_SHA }
  cache-from = ["type=gha,scope=api-images"]
}

target "api" {
  inherits = ["common"]
  target   = "runner"
  tags     = ["inzpro-api:${RELEASE_SHA}"]
  output   = ["type=docker,dest=${OUTPUT_DIR}/api.tar"]
  cache-to = ["type=gha,scope=api-images,mode=max"]
}

target "worker" {
  inherits = ["common"]
  target   = "worker"
  tags     = ["inzpro-worker:${RELEASE_SHA}"]
  output   = ["type=docker,dest=${OUTPUT_DIR}/worker.tar"]
}
